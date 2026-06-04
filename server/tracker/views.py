from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import chromadb

from .models import JobApplication, TodoItem, CalendarEvent, TrackerProfile, CustomGoal

# Helper to get/update user streak
def get_and_update_streak(user_id):
    profile, created = TrackerProfile.objects.get_or_create(user_id=user_id)
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
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
        collection = chroma_client.get_or_create_collection(
            name="cv_chunks",
            metadata={"hnsw:space": "cosine"}
        )
        skills_data = collection.get(where={"user_id": user_id, "section": "skills"})
        skills_count = 0
        if skills_data and skills_data["documents"]:
            for doc in skills_data["documents"]:
                # Split by commas, newlines, or bullet points to approximate skill count
                parts = [p.strip() for p in doc.replace("\n", ",").replace("•", ",").replace("·", ",").split(",") if p.strip()]
                skills_count += len(parts)
        return skills_count
    except Exception as e:
        print("Error getting skills count from ChromaDB:", e)
        return 0


class JobApplicationView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        apps = JobApplication.objects.filter(user_id=user_id).order_by("-id")
        data = [{
            "id": a.id,
            "role": a.role,
            "company": a.company,
            "status": a.status,
            "date": a.date.strftime("%b %d")
        } for a in apps]
        return Response(data)

    def post(self, request):
        user_id = request.data.get("user_id")
        role = request.data.get("role")
        company = request.data.get("company")
        status_val = request.data.get("status", "Applied")

        if not user_id or not role or not company:
            return Response({"error": "Missing fields"}, status=400)

        app = JobApplication.objects.create(
            user_id=user_id,
            role=role,
            company=company,
            status=status_val
        )
        # Update profile activity date to maintain streak
        get_and_update_streak(user_id)

        return Response({
            "id": app.id,
            "role": app.role,
            "company": app.company,
            "status": app.status,
            "date": app.date.strftime("%b %d")
        }, status=201)

    def put(self, request, pk):
        try:
            app = JobApplication.objects.get(pk=pk)
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
            "id": app.id,
            "role": app.role,
            "company": app.company,
            "status": app.status,
            "date": app.date.strftime("%b %d")
        })

    def delete(self, request, pk):
        try:
            app = JobApplication.objects.get(pk=pk)
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
        todos = TodoItem.objects.filter(user_id=user_id).order_by("-id")
        data = [{
            "id": t.id,
            "text": t.text,
            "completed": t.completed
        } for t in todos]
        return Response(data)

    def post(self, request):
        user_id = request.data.get("user_id")
        text = request.data.get("text")
        if not user_id or not text:
            return Response({"error": "Missing fields"}, status=400)

        todo = TodoItem.objects.create(user_id=user_id, text=text)
        get_and_update_streak(user_id)

        return Response({
            "id": todo.id,
            "text": todo.text,
            "completed": todo.completed
        }, status=201)

    def put(self, request, pk):
        try:
            todo = TodoItem.objects.get(pk=pk)
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
            "id": todo.id,
            "text": todo.text,
            "completed": todo.completed
        })

    def delete(self, request, pk):
        try:
            todo = TodoItem.objects.get(pk=pk)
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
        events = CalendarEvent.objects.filter(user_id=user_id)
        events_data = [{
            "id": f"event_{e.id}",
            "title": e.title,
            "date": e.date.strftime("%Y-%m-%d"),
            "event_type": e.event_type
        } for e in events]

        # Automatically synthesize events from Job Applications
        apps = JobApplication.objects.filter(user_id=user_id)
        for a in apps:
            events_data.append({
                "id": f"app_{a.id}",
                "title": f"{a.role} application at {a.company}",
                "date": a.date.strftime("%Y-%m-%d"),
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

        event = CalendarEvent.objects.create(
            user_id=user_id,
            title=title,
            date=date_val,
            event_type=event_type
        )
        get_and_update_streak(user_id)

        return Response({
            "id": f"event_{event.id}",
            "title": event.title,
            "date": event.date.strftime("%Y-%m-%d"),
            "event_type": event.event_type
        }, status=201)

    def delete(self, request, pk):
        # We check if it is a synthetic app event (starts with app_) or custom event (starts with event_)
        # We can extract the actual numeric ID from pk
        clean_id = pk.split("_")[-1]
        try:
            event = CalendarEvent.objects.get(pk=clean_id)
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
        profile, _ = TrackerProfile.objects.get_or_create(user_id=user_id)
        return Response({"goal_target": profile.goal_target})

    def post(self, request):
        user_id = request.data.get("user_id")
        target = request.data.get("goal_target")
        if not user_id or target is None:
            return Response({"error": "Missing fields"}, status=400)

        profile, _ = TrackerProfile.objects.get_or_create(user_id=user_id)
        profile.goal_target = int(target)
        profile.save()

        return Response({"goal_target": profile.goal_target})


class CustomGoalView(APIView):
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        goals = CustomGoal.objects.filter(user_id=user_id).order_by("-created_at")
        return Response([{
            "id": g.id,
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
        g = CustomGoal.objects.create(user_id=user_id, text=text, deadline=deadline)
        get_and_update_streak(user_id)
        return Response({"id": g.id, "text": g.text, "deadline": deadline_str, "completed": g.completed}, status=201)

    def put(self, request, pk):
        try:
            g = CustomGoal.objects.get(pk=pk)
        except CustomGoal.DoesNotExist:
            return Response({"error": "Not found"}, status=404)
        user_id = request.data.get("user_id")
        if g.user_id != user_id:
            return Response({"error": "Unauthorized"}, status=403)
        g.completed = request.data.get("completed", g.completed)
        g.text = request.data.get("text", g.text)
        g.save()
        return Response({"id": g.id, "text": g.text, "deadline": g.deadline.strftime("%Y-%m-%d") if g.deadline else None, "completed": g.completed})

    def delete(self, request, pk):
        try:
            g = CustomGoal.objects.get(pk=pk)
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
        total_apps = JobApplication.objects.filter(user_id=user_id).count()

        # 2. Dynamic weekly goal progress (apps added in last 7 days)
        profile, _ = TrackerProfile.objects.get_or_create(user_id=user_id)
        seven_days_ago = datetime.now().date() - timedelta(days=7)
        weekly_apps_count = JobApplication.objects.filter(
            user_id=user_id,
            date__gte=seven_days_ago
        ).count()

        # 3. Dynamic skills count from vector database
        skills_count = get_skills_count(user_id)

        # 4. Streak count
        streak = get_and_update_streak(user_id)

        # 5. Additional counter for interviews
        interviews_count = JobApplication.objects.filter(
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
        weekly_apps = JobApplication.objects.filter(user_id=user_id, date__gte=seven_days_ago).count()
        if weekly_apps == 0:
            nudges.append({
                "type": "warning",
                "icon": "📭",
                "message": "You haven't applied to any jobs this week. Stay consistent — aim for at least 1 application today.",
                "action": "Go to Job Hunter"
            })
        elif weekly_apps < 3:
            nudges.append({
                "type": "info",
                "icon": "📊",
                "message": f"You've applied to {weekly_apps} job(s) this week. Keep the momentum going to hit your weekly goal!",
                "action": None
            })

        # 2. Check for interviews this week
        interviews = JobApplication.objects.filter(user_id=user_id, status="Interviewing").count()
        if interviews > 0:
            nudges.append({
                "type": "success",
                "icon": "🎯",
                "message": f"You have {interviews} active interview(s). Prepare with mock Q&A and review the job descriptions.",
                "action": "Open Tracker"
            })

        # 3. Check if CV was uploaded
        try:
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection = chroma_client.get_or_create_collection(
                name="cv_chunks",
                metadata={"hnsw:space": "cosine"}
            )
            cv_data = collection.get(where={"user_id": user_id})
            if not cv_data["ids"]:
                nudges.append({
                    "type": "warning",
                    "icon": "📄",
                    "message": "Your CV hasn't been uploaded yet. Upload it so AI can personalize all recommendations.",
                    "action": "Upload CV"
                })
        except Exception:
            pass

        # 4. Streak reminder
        profile, _ = TrackerProfile.objects.get_or_create(user_id=user_id)
        if profile.streak >= 3:
            nudges.append({
                "type": "success",
                "icon": "🔥",
                "message": f"You're on a {profile.streak}-day streak! Don't break it — do something career-related today.",
                "action": None
            })

        # 5. Check todos — if more than 3 incomplete tasks
        incomplete_todos = TodoItem.objects.filter(user_id=user_id, completed=False).count()
        if incomplete_todos > 3:
            nudges.append({
                "type": "info",
                "icon": "✅",
                "message": f"You have {incomplete_todos} pending tasks. Try completing 2–3 today to build momentum.",
                "action": "Open Tasks"
            })

        # 6. Offer received — celebrate
        offers = JobApplication.objects.filter(user_id=user_id, status="Offer").count()
        if offers > 0:
            nudges.append({
                "type": "success",
                "icon": "🎉",
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
