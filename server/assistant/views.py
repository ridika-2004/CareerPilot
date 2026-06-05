import json
from mongoengine.errors import DoesNotExist
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import ChatSession
from .models import Message

from .services import generate_reply, hunt_jobs


@csrf_exempt
def create_session(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "POST only"},
            status=405
        )

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        body = {}

    user_id = body.get("user_id", "anonymous")

    session = ChatSession(user_id=user_id)
    session.save()

    return JsonResponse({
        "id": str(session.id),
        "title": session.title,
        "messages": []
    })


@csrf_exempt
def get_sessions(request):

    user_id = request.GET.get("user_id", "")

    query = {}
    if user_id:
        query["user_id"] = user_id

    sessions = (
        ChatSession.objects
        .filter(**query)
        .order_by("-updated_at")
    )

    data = []

    for s in sessions:
        data.append({
            "id": str(s.id),
            "title": s.title
        })

    return JsonResponse(
        data,
        safe=False
    )


@csrf_exempt
def get_session(request, session_id):

    session = ChatSession.objects.get(
        id=session_id
    )

    return JsonResponse({
        "id": str(session.id),
        "title": session.title,
        "messages": [
            {
                "role": m.role,
                "content": m.content
            }
            for m in session.messages
        ]
    })


@csrf_exempt
def rename_session(request, session_id):

    body = json.loads(
        request.body
    )

    title = body["title"]

    session = ChatSession.objects.get(
        id=session_id
    )

    session.title = title
    session.save()

    return JsonResponse({
        "success": True
    })


@csrf_exempt
def delete_session(request, session_id):

    ChatSession.objects.get(
        id=session_id
    ).delete()

    return JsonResponse({
        "success": True
    })


@csrf_exempt
def send_message(request):

    if request.method!= "POST":
        return JsonResponse(
            {"error": "POST request required"},
            status=405
        )
    
    try:
        body = json.loads(request.body)
    
    
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    session_id = body.get("sessionId")
    message = body.get("message")
    user_id = body.get("user_id")

    if not session_id or not message:
        return JsonResponse(
            {"error": "sessionId and message are required"},status=400)

    try:
        session = ChatSession.objects.get(
            id=session_id
        )
    except DoesNotExist:
        return JsonResponse(
            {"error": "Session not found"},
            status=404
        )

    user_message = Message(
        role="user",
        content=message
    )

    session.messages.append(
        user_message
    )

    if (
        session.title == "New Chat"
        and len(session.messages) == 1
    ):
        session.title = message[:30]

    try:
        reply = generate_reply(
            session.messages,
            user_id=user_id
        )
    except Exception as e:
        import traceback
        print(f"[Assistant Error] {type(e).__name__}: {e}")
        traceback.print_exc()
        return JsonResponse(
            {"error": str(e)},
            status=500
        )
    
    assistant_message = Message(
        role="assistant",
        content=reply
    )

    session.messages.append(
        assistant_message
    )

    session.save()

    return JsonResponse({
        "message": {
            "role": "assistant",
            "content": reply
        }
    })


@csrf_exempt
def hunt_jobs_view(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "POST only"},
            status=405
        )

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    query = body.get("query")
    user_id = body.get("user_id")

    if not query:
        return JsonResponse(
            {"error": "query is required"},
            status=400
        )

    if not user_id:
        return JsonResponse(
            {"error": "user_id is required"},
            status=400
        )

    try:
        result = hunt_jobs(query, user_id)
        return JsonResponse(result)
    except ValueError as e:
        return JsonResponse(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )