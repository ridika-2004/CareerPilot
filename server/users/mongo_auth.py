from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import AuthenticationFailed

from .mongo_models import MongoToken, MongoUser


class MongoUserWrapper:
    """
    Wraps a MongoUser so it behaves enough like Django's User
    for DRF's IsAuthenticated and request.user usage.
    """

    def __init__(self, mongo_user):
        self._mongo_user = mongo_user

    @property
    def id(self):
        return str(self._mongo_user.id)

    @property
    def pk(self):
        return self.id

    @property
    def username(self):
        return self._mongo_user.username

    @property
    def email(self):
        return self._mongo_user.email

    @property
    def first_name(self):
        parts = self._mongo_user.full_name.split(" ", 1)
        return parts[0] if parts else ""

    @property
    def last_name(self):
        parts = self._mongo_user.full_name.split(" ", 1)
        return parts[1] if len(parts) > 1 else ""

    @property
    def role(self):
        return self._mongo_user.role

    @property
    def is_active(self):
        return self._mongo_user.is_active

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def date_joined(self):
        return self._mongo_user.date_joined

    @property
    def full_name(self):
        return self._mongo_user.full_name

    @property
    def mongo_user(self):
        return self._mongo_user

    def __str__(self):
        return self._mongo_user.username


class MongoTokenAuthentication(BaseAuthentication):
    """
    Token-based authentication backed by MongoDB.
    Reads 'Authorization: Token <key>' header.
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "token":
            return None

        token_key = parts[1]

        try:
            token = MongoToken.objects.get(key=token_key)
        except MongoToken.DoesNotExist:
            raise AuthenticationFailed("Invalid token.")

        try:
            mongo_user = MongoUser.objects.get(id=token.user_id)
        except MongoUser.DoesNotExist:
            raise AuthenticationFailed("User not found.")

        if not mongo_user.is_active:
            raise AuthenticationFailed("User account is disabled.")

        return (MongoUserWrapper(mongo_user), token)

    def authenticate_header(self, request):
        return "Token"


class IsAuthenticatedMongo(BasePermission):
    """
    Allows access only to authenticated users (MongoDB-backed).
    """

    def has_permission(self, request, view):
        return (
            request.user
            and hasattr(request.user, "is_authenticated")
            and request.user.is_authenticated
        )
