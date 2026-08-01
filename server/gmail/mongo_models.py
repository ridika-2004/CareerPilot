from datetime import datetime
from mongoengine import Document, StringField, DateTimeField


class GmailToken(Document):
    """Stores Gmail OAuth2 tokens per user."""
    user_id = StringField(required=True, unique=True, max_length=100)
    access_token = StringField(default="")
    refresh_token = StringField(default="")
    token_uri = StringField(default="https://oauth2.googleapis.com/token")
    client_id = StringField(default="")
    client_secret = StringField(default="")
    scopes = StringField(default="")
    token_expiry = DateTimeField(null=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "gmail_tokens",
        "indexes": ["user_id"]
    }

    def __str__(self):
        return f"GmailToken for user {self.user_id}"
