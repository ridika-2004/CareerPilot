import os
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .mongo_models import MongoUser, MongoToken
from .mongo_auth import MongoTokenAuthentication, IsAuthenticatedMongo


def _get_role(user):
    """user is a MongoUserWrapper — access .role directly."""
    try:
        return user.role
    except Exception:
        return "user"


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    full_name = request.data.get("full_name", "").strip()
    role = request.data.get("role", "user").strip()
    admin_key = request.data.get("admin_key", "").strip()

    if not username or not email or not password:
        return Response(
            {"error": "Username, email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role not in ("user", "admin"):
        return Response(
            {"error": "Role must be 'user' or 'admin'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role == "admin":
        expected_key = os.getenv("ADMIN_SECRET_KEY", "")
        if not admin_key or admin_key != expected_key:
            return Response(
                {"error": "Invalid admin secret key."},
                status=status.HTTP_403_FORBIDDEN,
            )

    if MongoUser.objects(username=username).count() > 0:
        return Response(
            {"error": "Username already taken."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if MongoUser.objects(email=email).count() > 0:
        return Response(
            {"error": "Email already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = MongoUser(
        username=username,
        email=email,
        full_name=full_name,
        role=role,
    )
    user.set_password(password)
    user.save()

    token = MongoToken.create_for_user(user)

    return Response(
        {
            "token": token.key,
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": role,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Try username first, then fall back to email
    user = MongoUser.objects(username=username).first()
    if user is None:
        user = MongoUser.objects(email=username).first()

    if user is None or not user.check_password(password):
        return Response(
            {"error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "Account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token = MongoToken.create_for_user(user)

    return Response(
        {
            "token": token.key,
            "user_id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }
    )


@api_view(["GET"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def me(request):
    user = request.user
    return Response(
        {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": _get_role(user),
        }
    )


@api_view(["POST"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def logout(request):
    try:
        # request.auth is the MongoToken from authentication
        if request.auth:
            request.auth.delete()
    except Exception:
        pass
    return Response({"detail": "Logged out."})


@api_view(["PATCH"])
@authentication_classes([MongoTokenAuthentication])
@permission_classes([IsAuthenticatedMongo])
def update_profile(request):
    user = request.user
    full_name = request.data.get("full_name")
    username = request.data.get("username")

    if full_name is not None:
        user.full_name = full_name.strip()

    if username is not None:
        username = username.strip()
        if username and username != user.username:
            if MongoUser.objects(username=username).count() > 0:
                return Response(
                    {"error": "Username already taken."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.username = username

    user.save()
    return Response({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": _get_role(user),
    })
