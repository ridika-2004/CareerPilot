from datetime import datetime
from mongoengine import Document, StringField, BooleanField, IntField, DateField, DateTimeField, ListField


class JobApplication(Document):
    user_id = StringField(required=True, max_length=100)
    role = StringField(required=True, max_length=200)
    company = StringField(required=True, max_length=200)
    status = StringField(default="Applied", max_length=50)  # Applied, Interviewing, Offer, Rejected
    date = DateField(default=datetime.utcnow)
    description = StringField(default="", max_length=5000)     # AI-extracted job description
    requirements = ListField(StringField(max_length=500))       # AI-extracted requirements list
    source_url = StringField(default="", max_length=1000)       # Original job URL

    meta = {
        "collection": "job_applications",
        "indexes": ["user_id", "-date"]
    }

    def __str__(self):
        return f"{self.role} at {self.company} ({self.status})"



class TodoItem(Document):
    user_id = StringField(required=True, max_length=100)
    text = StringField(required=True, max_length=500)
    completed = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "todo_items",
        "indexes": ["user_id", "-created_at"]
    }

    def __str__(self):
        return f"{self.text} - {'Done' if self.completed else 'Pending'}"


class CalendarEvent(Document):
    user_id = StringField(required=True, max_length=100)
    title = StringField(required=True, max_length=200)
    date = DateField(required=True)
    event_type = StringField(default="other", max_length=50)  # interview, deadline, other

    meta = {
        "collection": "calendar_events",
        "indexes": ["user_id", "date"]
    }

    def __str__(self):
        return f"{self.title} on {self.date}"


class TrackerProfile(Document):
    user_id = StringField(required=True, unique=True, max_length=100)
    goal_target = IntField(default=5)
    streak = IntField(default=1)
    last_activity_date = DateField(default=datetime.utcnow)

    meta = {
        "collection": "tracker_profiles",
        "indexes": ["user_id"]
    }

    def __str__(self):
        return f"Profile for {self.user_id} (Goal: {self.goal_target})"


class CustomGoal(Document):
    user_id = StringField(required=True, max_length=100)
    text = StringField(required=True, max_length=500)
    deadline = DateField(null=True)
    completed = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "custom_goals",
        "indexes": ["user_id", "-created_at"]
    }

    def __str__(self):
        return f"{self.text} (Due: {self.deadline or 'No deadline'})"

class Note(Document):
    user_id = StringField(required=True, max_length=100)
    title = StringField(required=True, max_length=200)
    content = StringField(default="")          # Markdown content
    pinned = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    deleted_at = DateTimeField(null=True)      # Soft delete timestamp

    meta = {
        "collection": "notes",
        "indexes": ["user_id", "pinned", "-updated_at", "deleted_at"]
    }

    def soft_delete(self):
        self.deleted_at = datetime.utcnow()
        self.save()

    def restore(self):
        self.deleted_at = None
        self.save()

    def __str__(self):
        return f"{self.title} (user: {self.user_id})"

