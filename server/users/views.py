import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .models import UserProfile


def _get_role(user):
    try:
        return user.profile.role
    except UserProfile.DoesNotExist:
        return "user"


@api_view(["POST"])
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

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already taken."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=full_name.split(" ")[0] if full_name else "",
        last_name=" ".join(full_name.split(" ")[1:]) if full_name else "",
    )
    UserProfile.objects.create(user=user, role=role)
    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "role": role,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
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
    user = authenticate(username=username, password=password)
    if user is None:
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

    if user is None:
        return Response(
            {"error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    role = _get_role(user)

    return Response(
        {
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "role": role,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    role = _get_role(user)
    return Response(
        {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": f"{user.first_name} {user.last_name}".strip(),
            "role": role,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({"detail": "Logged out."})
