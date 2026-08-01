import os
import json
import re
import requests as req
from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings as django_settings
from django.http import HttpResponseRedirect

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .mongo_models import GmailToken
from tracker.mongo_models import JobApplication


SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "http://127.0.0.1:8000/api/gmail/callback/")


def _get_flow():
    client_id = os.getenv("GMAIL_CLIENT_ID", "")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET", "")
    return Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )


def _creds_from_token(token_doc):
    """Reconstruct Google Credentials from a stored GmailToken document."""
    return Credentials(
        token=token_doc.access_token,
        refresh_token=token_doc.refresh_token,
        token_uri=token_doc.token_uri,
        client_id=token_doc.client_id,
        client_secret=token_doc.client_secret,
        scopes=token_doc.scopes.split(",") if token_doc.scopes else SCOPES,
    )


def _classify_email_with_gemini(subject, snippet):
    """
    Use Gemini to classify an email as: interview_invite | rejection | offer | irrelevant
    Returns { type, company } or None on failure.
    """
    api_key = getattr(django_settings, "GEMINI_API_KEY", "")
    if not api_key:
        return None

    prompt = f"""Classify the following email related to a job application.

Subject: {subject}
Preview: {snippet}

Return ONLY valid JSON with these two keys:
- "type": one of "interview_invite", "rejection", "offer", "irrelevant"
- "company": the company name mentioned (empty string if unknown)

Examples:
- "We'd love to invite you for an interview" → {{"type": "interview_invite", "company": "Google"}}
- "We have decided to move forward with other candidates" → {{"type": "rejection", "company": "Meta"}}
- "We are pleased to offer you the position" → {{"type": "offer", "company": "Stripe"}}
- "Your LinkedIn Weekly Digest" → {{"type": "irrelevant", "company": ""}}

Return only JSON, no markdown."""

    try:
        resp = req.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.0, "maxOutputTokens": 100},
            },
            timeout=15,
        )
        resp.raise_for_status()
        raw = resp.json()
        content = raw["candidates"][0]["content"]["parts"][0]["text"]
        content = re.sub(r"^```(?:json)?\s*", "", content.strip())
        content = re.sub(r"\s*```$", "", content.strip())
        return json.loads(content)
    except Exception:
        return None


SUPPORTIVE_MESSAGES = [
    "Every 'no' is one step closer to 'yes'. Keep going — your next opportunity is around the corner. 💪",
    "Rejection is redirection. You've got this — the right role is still ahead. 🌟",
    "This one wasn't the right fit, but the right one is coming. Stay consistent. 🚀",
    "Even the best candidates get rejected. It's part of the journey — keep pushing. 🎯",
]


class GmailAuthURLView(APIView):
    """GET /api/gmail/auth-url/?user_id=<id> → returns the Google OAuth URL"""

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        client_id = os.getenv("GMAIL_CLIENT_ID", "")
        if not client_id:
            return Response({
                "error": "Gmail OAuth not configured. See setup instructions.",
                "setup_required": True
            }, status=503)

        flow = _get_flow()
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=user_id,  # pass user_id through state
        )
        return Response({"auth_url": auth_url})


class GmailCallbackView(APIView):
    """GET /api/gmail/callback/ — Google redirects here after OAuth"""

    def get(self, request):
        code = request.query_params.get("code")
        user_id = request.query_params.get("state")
        error = request.query_params.get("error")

        if error:
            frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return HttpResponseRedirect(f"{frontend}/dashboard?gmail_error={error}")

        if not code or not user_id:
            return Response({"error": "Missing code or state"}, status=400)

        try:
            flow = _get_flow()
            flow.fetch_token(code=code)
            creds = flow.credentials

            # Save/update token in MongoDB
            token_doc = GmailToken.objects(user_id=user_id).first()
            if not token_doc:
                token_doc = GmailToken(user_id=user_id)

            token_doc.access_token = creds.token
            token_doc.refresh_token = creds.refresh_token or token_doc.refresh_token
            token_doc.token_uri = creds.token_uri
            token_doc.client_id = creds.client_id
            token_doc.client_secret = creds.client_secret
            token_doc.scopes = ",".join(creds.scopes or SCOPES)
            token_doc.updated_at = datetime.utcnow()
            token_doc.save()

            frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return HttpResponseRedirect(f"{frontend}/dashboard?gmail_connected=true")
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class GmailStatusView(APIView):
    """GET /api/gmail/status/?user_id=<id> → { connected: bool }"""

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)
        token_doc = GmailToken.objects(user_id=user_id).first()
        client_id = os.getenv("GMAIL_CLIENT_ID", "")
        return Response({
            "connected": bool(token_doc and token_doc.refresh_token),
            "configured": bool(client_id),
        })


class GmailScanView(APIView):
    """
    POST /api/gmail/scan/
    Body: { user_id }
    Scans recent Gmail messages and auto-moves matching job application cards.
    Returns a list of actions taken.
    """

    def post(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        token_doc = GmailToken.objects(user_id=user_id).first()
        if not token_doc or not token_doc.refresh_token:
            return Response({"error": "Gmail not connected", "connect_required": True}, status=403)

        try:
            creds = _creds_from_token(token_doc)
            service = build("gmail", "v1", credentials=creds)

            # Fetch last 25 messages (unread and read, to be thorough)
            results = service.users().messages().list(
                userId="me", maxResults=25, labelIds=["INBOX"]
            ).execute()

            messages = results.get("messages", [])
            if not messages:
                return Response({"actions": [], "message": "No emails found in inbox."})

            # Load user's job applications for matching
            apps = list(JobApplication.objects(
                user_id=user_id,
                status__in=["Applied", "Interviewing"]
            ))

            actions = []
            processed = set()  # avoid double-processing same msg

            for msg_stub in messages:
                msg_id = msg_stub["id"]
                if msg_id in processed:
                    continue
                processed.add(msg_id)

                # Fetch message details
                msg = service.users().messages().get(
                    userId="me", id=msg_id, format="metadata",
                    metadataHeaders=["Subject", "From"]
                ).execute()

                headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
                subject = headers.get("Subject", "")
                snippet = msg.get("snippet", "")

                # Skip if too short to be relevant
                if len(subject) < 3 and len(snippet) < 10:
                    continue

                classification = _classify_email_with_gemini(subject, snippet)
                if not classification or classification.get("type") == "irrelevant":
                    continue

                email_type = classification.get("type")
                email_company = (classification.get("company") or "").lower().strip()

                # Try to match to a job application by company name
                matched_app = None
                if email_company:
                    for app in apps:
                        if email_company in app.company.lower() or app.company.lower() in email_company:
                            matched_app = app
                            break

                if not matched_app:
                    # No match — still record the finding
                    actions.append({
                        "type": email_type,
                        "company": classification.get("company", "Unknown"),
                        "matched": False,
                        "message": f"Detected a {email_type.replace('_', ' ')} email from {classification.get('company', 'an unknown company')}, but no matching application found in your tracker.",
                    })
                    continue

                old_status = matched_app.status
                new_status = old_status  # default: no change
                supportive_msg = None

                if email_type == "interview_invite" and old_status == "Applied":
                    new_status = "Interviewing"
                elif email_type == "rejection":
                    new_status = "Rejected"
                    import random
                    supportive_msg = random.choice(SUPPORTIVE_MESSAGES)
                elif email_type == "offer":
                    new_status = "Offer"

                if new_status != old_status:
                    matched_app.status = new_status
                    matched_app.save()

                action = {
                    "type": email_type,
                    "company": matched_app.company,
                    "role": matched_app.role,
                    "matched": True,
                    "old_status": old_status,
                    "new_status": new_status,
                    "changed": new_status != old_status,
                }
                if supportive_msg:
                    action["supportive_message"] = supportive_msg

                actions.append(action)

            if not actions:
                return Response({
                    "actions": [],
                    "message": "No job-related emails detected. Your inbox looks quiet! ✅"
                })

            return Response({"actions": actions})

        except Exception as e:
            # Handle token expiry gracefully
            err_str = str(e)
            if "invalid_grant" in err_str or "Token has been expired" in err_str:
                return Response({"error": "Gmail token expired. Please reconnect.", "connect_required": True}, status=403)
            return Response({"error": err_str}, status=500)
