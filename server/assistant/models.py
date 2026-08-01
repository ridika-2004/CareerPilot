from mongoengine import *
from datetime import datetime


class Message(EmbeddedDocument):
    role = StringField(required=True)
    content = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)


class ChatSession(Document):
    user_id = StringField(default="anonymous")
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
        "collection": "chat_sessions",
        "indexes": ["user_id"]
    }


from mongoengine import Document, StringField, DateTimeField, DictField
from datetime import datetime

class JobApplication(Document):
    user_id = StringField(required=True)
    job_id = StringField(required=True)   # unique identifier from the job source
    job_data = DictField()                # store the full job details (optional)
    applied_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': [
            {'fields': ['user_id', 'job_id'], 'unique': True}
        ]
    }