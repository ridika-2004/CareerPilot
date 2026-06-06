import secrets
from datetime import datetime
from mongoengine import Document, StringField, BooleanField, DateTimeField


class MongoUser(Document):
    username = StringField(required=True, unique=True, max_length=150)
    email = StringField(required=True, unique=True, max_length=254)
    password_hash = StringField(required=True, max_length=256)
    full_name = StringField(default="", max_length=300)
    role = StringField(default="user", max_length=10)  # "user" or "admin"
    is_active = BooleanField(default=True)
    date_joined = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "users",
        "indexes": ["username", "email", "role"]
    }

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)

    @property
    def id_str(self):
        return str(self.id)

    def __str__(self):
        return f"{self.username} ({self.role})"


class MongoToken(Document):
    key = StringField(required=True, unique=True, max_length=64)
    user_id = StringField(required=True)  # Store MongoUser.id as string

    meta = {
        "collection": "auth_tokens",
        "indexes": ["key", "user_id"]
    }

    @classmethod
    def generate_key(cls):
        return secrets.token_hex(32)

    @classmethod
    def create_for_user(cls, user):
        # Delete any existing tokens for this user
        cls.objects(user_id=str(user.id)).delete()
        token = cls(key=cls.generate_key(), user_id=str(user.id))
        token.save()
        return token

    def __str__(self):
        return f"Token for user {self.user_id}"
