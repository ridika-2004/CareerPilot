from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import chromadb
import requests
import json
import re
from bs4 import BeautifulSoup

from .mongo_models import JobApplication, TodoItem, CalendarEvent, TrackerProfile, CustomGoal

from django.conf import settings as django_settings

# Helper to get or create tracker profile
def get_or_create_profile(user_id):
    profile = TrackerProfile.objects(user_id=user_id).first()
    if profile is None:
        profile = TrackerProfile(user_id=user_id, goal_target=5, streak=1, last_activity_date=datetime.utcnow().date())
        profile.save()
        return profile, True
    return profile, False


# Helper to get/update user streak
def get_and_update_streak(user_id):
    profile, created = get_or_create_profile(user_id)
    today = datetime.now().date()
    if created:
        profile.streak = 1
        profile.last_activity_date = today
        profile.save()
    else:
        delta = today - profile.last_activity_date
        if delta.days == 1:
            profile.streak += 1
            profile.last_activity_date = today
            profile.save()
        elif delta.days > 1:
            profile.streak = 1
            profile.last_activity_date = today
            profile.save()
    return profile.streak

# Helper to count skills in Vector DB
def get_skills_count(user_id):
    try:
        chroma_db_path = getattr(django_settings, "CHROMA_DB_PATH", "./chroma_db")
        chroma_client = chromadb.PersistentClient(path=chroma_db_path)
        collection = chroma_client.get_or_create_collection(
            name="cv_chunks",
            metadata={"hnsw:space": "cosine"}
        )
        skills_data = collection.get(where={"$and": [{"user_id": user_id}, {"section": "skills"}]})
        skills_count = 0
        if skills_data and skills_data["documents"]:
            for doc in skills_data["documents"]:
                # Normalize separators: newlines, bullets, pipes, semicolons, commas
                normalized = doc.replace("\n", ",").replace("\u2022", ",").replace("\u00b7", ",")
                normalized = normalized.replace("|", ",").replace(";", ",")
                parts = [p.strip() for p in normalized.split(",") if p.strip()]
                # Filter out section header lines like "SKILLS", "Technical Skills", etc.
                header_words = {"skills", "technical", "tools", "languages", "technologies", "competencies", "stack"}
                filtered = [
                    p for p in parts
                    if len(p) > 1 and not all(w.lower() in header_words for w in p.split())
                ]
                skills_count += len(filtered)
        return skills_count
    except Exception as e:
        print("Error getting skills count from ChromaDB:", e)
        return 0


class JobApplicationView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        apps = JobApplication.objects(user_id=user_id).order_by("-id")
        data = [{
            "id": str(a.id),
            "role": a.role,
            "company": a.company,
            "status": a.status,
            "date": a.date.strftime("%b %d") if a.date else ""
        } for a in apps]
        return Response(data)

    def post(self, request):
        user_id = request.data.get("user_id")
        role = request.data.get("role")
        company = request.data.get("company")
        status_val = request.data.get("status", "Applied")
        description = request.data.get("description", "")
        requirements = request.data.get("requirements", [])
        source_url = request.data.get("source_url", "")

        if not user_id or not role or not company:
            return Response({"error": "Missing fields"}, status=400)

        app = JobApplication(
            user_id=user_id,
            role=role,
            company=company,
            status=status_val,
            description=description,
            requirements=requirements,
            source_url=source_url,
        )
        app.save()
        # Update profile activity date to maintain streak
        get_and_update_streak(user_id)

        return Response({
            "id": str(app.id),
            "role": app.role,
            "company": app.company,
            "status": app.status,
            "date": app.date.strftime("%b %d") if app.date else "",
            "description": app.description,
            "requirements": app.requirements or [],
            "source_url": app.source_url,
        }, status=201)

    def put(self, request, pk):
        try:
            app = JobApplication.objects.get(id=pk)
        except JobApplication.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        user_id = request.data.get("user_id")
        if app.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)

        app.role = request.data.get("role", app.role)
        app.company = request.data.get("company", app.company)
        app.status = request.data.get("status", app.status)
        app.save()

        get_and_update_streak(user_id)

        return Response({
            "id": str(app.id),
            "role": app.role,
            "company": app.company,
            "status": app.status,
            "date": app.date.strftime("%b %d") if app.date else ""
        })

    def delete(self, request, pk):
        try:
            app = JobApplication.objects.get(id=pk)
        except JobApplication.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if app.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)

        app.delete()
        return Response({"success": True}, status=200)


class TodoItemView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        todos = TodoItem.objects(user_id=user_id).order_by("-id")
        data = [{
            "id": str(t.id),
            "text": t.text,
            "completed": t.completed
        } for t in todos]
        return Response(data)

    def post(self, request):
        user_id = request.data.get("user_id")
        text = request.data.get("text")
        if not user_id or not text:
            return Response({"error": "Missing fields"}, status=400)

        todo = TodoItem(user_id=user_id, text=text)
        todo.save()
        get_and_update_streak(user_id)

        return Response({
            "id": str(todo.id),
            "text": todo.text,
            "completed": todo.completed
        }, status=201)

    def put(self, request, pk):
        try:
            todo = TodoItem.objects.get(id=pk)
        except TodoItem.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        user_id = request.data.get("user_id")
        if todo.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)

        todo.completed = request.data.get("completed", todo.completed)
        todo.text = request.data.get("text", todo.text)
        todo.save()

        get_and_update_streak(user_id)

        return Response({
            "id": str(todo.id),
            "text": todo.text,
            "completed": todo.completed
        })

    def delete(self, request, pk):
        try:
            todo = TodoItem.objects.get(id=pk)
        except TodoItem.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if todo.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)

        todo.delete()
        return Response({"success": True}, status=200)


class CalendarEventView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        # Get custom events
        events = CalendarEvent.objects(user_id=user_id)
        events_data = [{
            "id": f"event_{e.id}",
            "title": e.title,
            "date": e.date.strftime("%Y-%m-%d") if e.date else "",
            "event_type": e.event_type
        } for e in events]

        # Automatically synthesize events from Job Applications
        apps = JobApplication.objects(user_id=user_id)
        for a in apps:
            events_data.append({
                "id": f"app_{a.id}",
                "title": f"{a.role} application at {a.company}",
                "date": a.date.strftime("%Y-%m-%d") if a.date else "",
                "event_type": "interview" if a.status == "Interviewing" else "deadline" if a.status == "Applied" else "other"
            })

        return Response(events_data)

    def post(self, request):
        user_id = request.data.get("user_id")
        title = request.data.get("title")
        date_str = request.data.get("date")
        event_type = request.data.get("event_type", "other")

        if not user_id or not title or not date_str:
            return Response({"error": "Missing fields"}, status=400)

        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format, use YYYY-MM-DD"}, status=400)

        event = CalendarEvent(
            user_id=user_id,
            title=title,
            date=date_val,
            event_type=event_type
        )
        event.save()
        get_and_update_streak(user_id)

        return Response({
            "id": f"event_{event.id}",
            "title": event.title,
            "date": event.date.strftime("%Y-%m-%d") if event.date else "",
            "event_type": event.event_type
        }, status=201)

    def delete(self, request, pk):
        # We check if it is a synthetic app event (starts with app_) or custom event (starts with event_)
        # We can extract the actual ID from pk
        clean_id = pk.split("_", 1)[-1] if "_" in pk else pk
        try:
            event = CalendarEvent.objects.get(id=clean_id)
        except CalendarEvent.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if event.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)

        event.delete()
        return Response({"success": True}, status=200)


class GoalView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        profile, _ = get_or_create_profile(user_id)
        return Response({"goal_target": profile.goal_target})

    def post(self, request):
        user_id = request.data.get("user_id")
        target = request.data.get("goal_target")
        if not user_id or target is None:
            return Response({"error": "Missing fields"}, status=400)

        profile, _ = get_or_create_profile(user_id)
        profile.goal_target = int(target)
        profile.save()

        return Response({"goal_target": profile.goal_target})


class CustomGoalView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        goals = CustomGoal.objects(user_id=user_id).order_by("-created_at")
        return Response([{
            "id": str(g.id),
            "text": g.text,
            "deadline": g.deadline.strftime("%Y-%m-%d") if g.deadline else None,
            "completed": g.completed,
        } for g in goals])

    def post(self, request):
        user_id = request.data.get("user_id")
        text = request.data.get("text")
        deadline_str = request.data.get("deadline")
        if not user_id or not text:
            return Response({"error": "Missing fields"}, status=400)
        deadline = None
        if deadline_str:
            try:
                deadline = datetime.strptime(deadline_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"error": "Invalid date format"}, status=400)
        g = CustomGoal(user_id=user_id, text=text, deadline=deadline)
        g.save()
        get_and_update_streak(user_id)
        return Response({
            "id": str(g.id),
            "text": g.text,
            "deadline": deadline_str,
            "completed": g.completed
        }, status=201)

    def put(self, request, pk):
        try:
            g = CustomGoal.objects.get(id=pk)
        except CustomGoal.DoesNotExist:
            return Response({"error": "Not found"}, status=404)
        user_id = request.data.get("user_id")
        if g.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)
        g.completed = request.data.get("completed", g.completed)
        g.text = request.data.get("text", g.text)
        g.save()
        return Response({
            "id": str(g.id),
            "text": g.text,
            "deadline": g.deadline.strftime("%Y-%m-%d") if g.deadline else None,
            "completed": g.completed
        })

    def delete(self, request, pk):
        try:
            g = CustomGoal.objects.get(id=pk)
        except CustomGoal.DoesNotExist:
            return Response({"error": "Not found"}, status=404)
        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if g.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)
        g.delete()
        return Response({"success": True})


class DashboardStatsView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        # 1. Total applications sent
        total_apps = JobApplication.objects(user_id=user_id).count()

        # 2. Dynamic weekly goal progress (apps added in last 7 days)
        profile, _ = get_or_create_profile(user_id)
        seven_days_ago = datetime.now().date() - timedelta(days=7)
        weekly_apps_count = JobApplication.objects(
            user_id=user_id,
            date__gte=seven_days_ago
        ).count()

        # 3. Dynamic skills count from vector database
        skills_count = get_skills_count(user_id)

        # 4. Streak count
        streak = get_and_update_streak(user_id)

        # 5. Additional counter for interviews
        interviews_count = JobApplication.objects(
            user_id=user_id,
            status="Interviewing"
        ).count()

        return Response({
            "applications_sent": total_apps,
            "weekly_progress": weekly_apps_count,
            "goal_target": profile.goal_target,
            "skills_added": skills_count,
            "streak": streak,
            "interviews_scheduled": interviews_count
        })


class AINudgesView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        nudges = []
        today = datetime.now().date()
        seven_days_ago = today - timedelta(days=7)

        # 1. No applications this week
        weekly_apps = JobApplication.objects(user_id=user_id, date__gte=seven_days_ago).count()
        if weekly_apps == 0:
            nudges.append({
                "type": "warning",
                "icon": "\U0001f4ed",
                "message": "You haven't applied to any jobs this week. Stay consistent \u2014 aim for at least 1 application today.",
                "action": "Go to Job Hunter"
            })
        elif weekly_apps < 3:
            nudges.append({
                "type": "info",
                "icon": "\U0001f4ca",
                "message": f"You've applied to {weekly_apps} job(s) this week. Keep the momentum going to hit your weekly goal!",
                "action": None
            })

        # 2. Check for interviews this week
        interviews = JobApplication.objects(user_id=user_id, status="Interviewing").count()
        if interviews > 0:
            nudges.append({
                "type": "success",
                "icon": "\U0001f3af",
                "message": f"You have {interviews} active interview(s). Prepare with mock Q&A and review the job descriptions.",
                "action": "Open Tracker"
            })

        # 3. Check if CV was uploaded
        try:
            chroma_db_path = getattr(django_settings, "CHROMA_DB_PATH", "./chroma_db")
            chroma_client = chromadb.PersistentClient(path=chroma_db_path)
            collection = chroma_client.get_or_create_collection(
                name="cv_chunks",
                metadata={"hnsw:space": "cosine"}
            )
            cv_data = collection.get(where={"user_id": user_id})
            if not cv_data["ids"]:
                nudges.append({
                    "type": "warning",
                    "icon": "\U0001f4c4",
                    "message": "Your CV hasn't been uploaded yet. Upload it so AI can personalize all recommendations.",
                    "action": "Upload CV"
                })
        except Exception:
            pass

        # 4. Streak reminder
        profile, _ = get_or_create_profile(user_id)
        if profile.streak >= 3:
            nudges.append({
                "type": "success",
                "icon": "\U0001f525",
                "message": f"You're on a {profile.streak}-day streak! Don't break it \u2014 do something career-related today.",
                "action": None
            })

        # 5. Check todos — if more than 3 incomplete tasks
        incomplete_todos = TodoItem.objects(user_id=user_id, completed=False).count()
        if incomplete_todos > 3:
            nudges.append({
                "type": "info",
                "icon": "\u2705",
                "message": f"You have {incomplete_todos} pending tasks. Try completing 2\u20133 today to build momentum.",
                "action": "Open Tasks"
            })

        # 6. Offer received — celebrate
        offers = JobApplication.objects(user_id=user_id, status="Offer").count()
        if offers > 0:
            nudges.append({
                "type": "success",
                "icon": "\U0001f389",
                "message": f"Congratulations! You have {offers} job offer(s). Review them carefully before deciding.",
                "action": None
            })

        # Default nudge if nothing else triggered
        if not nudges:
            nudges.append({
                "type": "info",
                "icon": "💡",
                "message": "Keep going! Consistent daily effort is the key to landing your next role. Check your goals.",
                "action": "Open Goals"
            })

        return Response(nudges)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .mongo_models import Note
from users.mongo_auth import MongoTokenAuthentication, IsAuthenticatedMongo   # adjust import path if needed

class NoteView(APIView):
    authentication_classes = [MongoTokenAuthentication]
    permission_classes = [IsAuthenticatedMongo]

    def get_user_id(self, request):
        # Get user_id from authenticated user (MongoUserWrapper)
        return request.user.id

    def get(self, request):
        user_id = self.get_user_id(request)
        # Only fetch non-deleted notes
        notes = Note.objects(user_id=user_id, deleted_at=None).order_by("-pinned", "-updated_at")
        data = [{
            "id": str(n.id),
            "title": n.title,
            "content": n.content,
            "pinned": n.pinned,
            "createdAt": n.created_at.isoformat(),
            "updatedAt": n.updated_at.isoformat(),
        } for n in notes]
        return Response(data)

    def post(self, request):
        user_id = self.get_user_id(request)
        title = request.data.get("title", "").strip()
        content = request.data.get("content", "")

        if not title:
            return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)

        note = Note(
            user_id=user_id,
            title=title,
            content=content,
            pinned=False
        )
        note.save()

        return Response({
            "id": str(note.id),
            "title": note.title,
            "content": note.content,
            "pinned": note.pinned,
            "createdAt": note.created_at.isoformat(),
            "updatedAt": note.updated_at.isoformat(),
        }, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        user_id = self.get_user_id(request)
        try:
            note = Note.objects.get(id=pk, user_id=user_id, deleted_at=None)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update fields
        if "title" in request.data:
            note.title = request.data["title"].strip()
        if "content" in request.data:
            note.content = request.data["content"]
        if "pinned" in request.data:
            note.pinned = request.data["pinned"]

        note.updated_at = datetime.utcnow()
        note.save()

        return Response({
            "id": str(note.id),
            "title": note.title,
            "content": note.content,
            "pinned": note.pinned,
            "createdAt": note.created_at.isoformat(),
            "updatedAt": note.updated_at.isoformat(),
        })

    def delete(self, request, pk):
        user_id = self.get_user_id(request)
        try:
            note = Note.objects.get(id=pk, user_id=user_id, deleted_at=None)
        except Note.DoesNotExist:
            return Response({"error": "Note not found"}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete
        note.soft_delete()
        return Response({"success": True, "restorable": True})


class NoteRestoreView(APIView):
    authentication_classes = [MongoTokenAuthentication]
    permission_classes = [IsAuthenticatedMongo]

    def post(self, request, pk):
        user_id = request.user.id
        try:
            note = Note.objects.get(id=pk, user_id=user_id, deleted_at__ne=None)
        except Note.DoesNotExist:
            return Response({"error": "Deleted note not found"}, status=status.HTTP_404_NOT_FOUND)

        note.restore()
        return Response({
            "id": str(note.id),
            "title": note.title,
            "content": note.content,
            "pinned": note.pinned,
            "createdAt": note.created_at.isoformat(),
            "updatedAt": note.updated_at.isoformat(),
        })


class JobScrapeView(APIView):
    """
    POST /api/tracker/scrape-job/
    Body: { "url": "https://..." }
    Returns: { role, company, description, requirements[], source_url, warning? }
    """

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    def _fetch_page_text(self, url):
        """Fetch URL and return (clean_text, meta_title, meta_description, warning)."""
        warning = None
        try:
            resp = requests.get(url, headers=self.HEADERS, timeout=10, allow_redirects=True)
        except Exception as e:
            return None, None, None, f"Could not reach URL: {str(e)}"

        if resp.status_code in (401, 403):
            warning = "This site requires login. Extracted from public preview only."
        elif resp.status_code != 200:
            return None, None, None, f"URL returned HTTP {resp.status_code}"

        soup = BeautifulSoup(resp.text, "html.parser")

        # Meta tags (reliable even for auth-walled pages)
        meta_title = (
            soup.find("meta", property="og:title") or
            soup.find("meta", attrs={"name": "title"})
        )
        meta_title = meta_title["content"] if meta_title and meta_title.get("content") else ""

        meta_desc = (
            soup.find("meta", property="og:description") or
            soup.find("meta", attrs={"name": "description"})
        )
        meta_desc = meta_desc["content"] if meta_desc and meta_desc.get("content") else ""

        # Remove boilerplate tags
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
            tag.decompose()

        # Extract main body text (capped at 6000 chars to stay within prompt limits)
        raw_text = soup.get_text(separator="\n", strip=True)
        clean_text = re.sub(r"\n{3,}", "\n\n", raw_text)[:6000]

        return clean_text, meta_title, meta_desc, warning

    def _call_gemini(self, text, meta_title, meta_desc):
        """Call Gemini to extract structured job info from page text."""
        api_key = getattr(django_settings, "GEMINI_API_KEY", "")
        if not api_key:
            return None, "GEMINI_API_KEY not configured"

        prompt = f"""You are a job listing parser. Extract the following fields from the text below.
Return ONLY valid JSON with these keys:
- "role": job title (string)
- "company": company name (string)
- "description": 2-3 sentence summary of what the role involves (string)
- "requirements": list of 5-8 key requirements or skills (array of strings)

If information is missing or unclear, use the meta title/description as fallback.
Meta title: {meta_title}
Meta description: {meta_desc}

Job page text:
{text}

Return only JSON, no markdown, no explanation."""

        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512}
                },
                timeout=20
            )
            resp.raise_for_status()
            raw = resp.json()
            content = raw["candidates"][0]["content"]["parts"][0]["text"]
            # Strip markdown code fences if present
            content = re.sub(r"^```(?:json)?\s*", "", content.strip())
            content = re.sub(r"\s*```$", "", content.strip())
            parsed = json.loads(content)
            return parsed, None
        except json.JSONDecodeError:
            return None, "AI returned non-JSON response"
        except Exception as e:
            return None, str(e)

    def post(self, request):
        url = request.data.get("url", "").strip()
        if not url:
            return Response({"error": "url is required"}, status=400)

        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        # Detect LinkedIn early
        is_linkedin = "linkedin.com" in url
        warning = None

        page_text, meta_title, meta_desc, fetch_warning = self._fetch_page_text(url)
        if fetch_warning and not page_text:
            return Response({"error": fetch_warning}, status=422)
        if fetch_warning:
            warning = fetch_warning

        # For LinkedIn with no real content, use meta fallback text
        text_to_parse = page_text if page_text and len(page_text) > 200 else f"{meta_title}\n{meta_desc}"

        extracted, ai_error = self._call_gemini(text_to_parse, meta_title, meta_desc)
        if ai_error and not extracted:
            # Graceful degradation: return what we have from meta tags
            return Response({
                "role": meta_title,
                "company": "",
                "description": meta_desc,
                "requirements": [],
                "source_url": url,
                "warning": f"AI parsing failed ({ai_error}). Filled from page meta-tags only."
            })

        result = {
            "role": extracted.get("role", meta_title) or meta_title,
            "company": extracted.get("company", ""),
            "description": extracted.get("description", meta_desc) or meta_desc,
            "requirements": extracted.get("requirements", []),
            "source_url": url,
        }
        if warning:
            result["warning"] = warning
        if is_linkedin and not result["company"]:
            result["warning"] = (result.get("warning", "") + " LinkedIn limits public job data. Please verify company name.").strip()

        return Response(result)
