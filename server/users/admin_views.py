import json as _json
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .mongo_models import MongoUser
from .mongo_auth import MongoTokenAuthentication, IsAuthenticatedMongo
from cv.mongo_models import CVUploadRecord
from tracker.mongo_models import JobApplication, TodoItem, CalendarEvent, TrackerProfile, CustomGoal


def _is_admin(user):
    try:
        return user.role == "admin"
    except Exception:
        return False


@api_view(["GET"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def admin_stats(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    total_users = MongoUser.objects.count()
    total_admins = MongoUser.objects(role="admin").count()
    total_regular = MongoUser.objects(role="user").count()
    total_cv_uploads = CVUploadRecord.objects.count()
    total_job_applications = JobApplication.objects.count()
    total_todos = TodoItem.objects.count()
    total_events = CalendarEvent.objects.count()
    total_goals = CustomGoal.objects.count()

    return Response({
        "total_users": total_users,
        "total_admins": total_admins,
        "total_regular_users": total_regular,
        "total_cv_uploads": total_cv_uploads,
        "total_job_applications": total_job_applications,
        "total_todos": total_todos,
        "total_calendar_events": total_events,
        "total_custom_goals": total_goals,
    })


@api_view(["GET"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def admin_users(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    users = MongoUser.objects.order_by("-date_joined")
    data = []
    for u in users:
        data.append({
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "date_joined": u.date_joined.isoformat() if u.date_joined else "",
            "is_active": u.is_active,
        })

    return Response(data)


@api_view(["GET"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def admin_cv_uploads(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    records = CVUploadRecord.objects.order_by("-uploaded_at")
    data = []
    for r in records:
        summary = {}
        if r.cv_summary:
            try:
                summary = _json.loads(r.cv_summary)
            except Exception:
                summary = {}
        data.append({
            "id": str(r.id),
            "user_id": r.user_id,
            "username": r.username,
            "file_name": r.file_name,
            "file_type": r.file_type,
            "chunks_stored": r.chunks_stored,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else "",
            "cv_summary": summary,
        })
    return Response(data)


@api_view(["GET"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def admin_job_applications(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    apps = JobApplication.objects.order_by("-date")
    data = [
        {
            "id": str(a.id),
            "user_id": a.user_id,
            "role": a.role,
            "company": a.company,
            "status": a.status,
            "date": a.date.isoformat() if a.date else "",
        }
        for a in apps
    ]
    return Response(data)


@api_view(["POST"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def admin_change_role(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    target_user_id = request.data.get("user_id")
    new_role = request.data.get("role", "").strip()

    if new_role not in ("user", "admin"):
        return Response({"error": "Role must be 'user' or 'admin'."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_user = MongoUser.objects.get(id=target_user_id)
    except MongoUser.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    target_user.role = new_role
    target_user.save()

    return Response({
        "message": f"Role updated to '{new_role}' for {target_user.username}.",
        "user_id": str(target_user.id),
        "username": target_user.username,
        "role": new_role,
    })
