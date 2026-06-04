from mongoengine import *
from datetime import datetime


class Message(EmbeddedDocument):
    role = StringField(required=True)
    content = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)


class ChatSession(Document):
    title = StringField(default="New Chat")

    created_at = DateTimeField(
        default=datetime.utcnow
    )

    updated_at = DateTimeField(
        default=datetime.utcnow
    )

    messages = EmbeddedDocumentListField(
        Message
    )

    meta = {
        "collection": "chat_sessions"
    }