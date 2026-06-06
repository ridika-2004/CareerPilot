from datetime import datetime
from mongoengine import Document, StringField, IntField, DateTimeField


class CVUploadRecord(Document):
    user_id = StringField(required=True, max_length=100)
    username = StringField(default="", max_length=150)
    file_name = StringField(required=True, max_length=300)
    file_type = StringField(default="", max_length=50)
    chunks_stored = IntField(default=0)
    cv_summary = StringField(default="")
    uploaded_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "cv_upload_records",
        "indexes": ["user_id", "-uploaded_at"]
    }

    def __str__(self):
        return f"{self.username or self.user_id} - {self.file_name}"
