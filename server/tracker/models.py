from django.db import models

class JobApplication(models.Model):
    user_id = models.CharField(max_length=100)
    role = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    status = models.CharField(max_length=50)  # Applied, Interviewing, Offer, Rejected
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.role} at {self.company} ({self.status})"

class TodoItem(models.Model):
    user_id = models.CharField(max_length=100)
    text = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.text} - {'Done' if self.completed else 'Pending'}"

class CalendarEvent(models.Model):
    user_id = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    date = models.DateField()
    event_type = models.CharField(max_length=50, default="other")  # interview, deadline, other

    def __str__(self):
        return f"{self.title} on {self.date}"

class TrackerProfile(models.Model):
    user_id = models.CharField(max_length=100, primary_key=True)
    goal_target = models.IntegerField(default=5)
    streak = models.IntegerField(default=1)
    last_activity_date = models.DateField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user_id} (Goal: {self.goal_target})"

class CustomGoal(models.Model):
    user_id = models.CharField(max_length=100)
    text = models.CharField(max_length=500)
    deadline = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.text} (Due: {self.deadline or 'No deadline'})"
