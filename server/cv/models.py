from django.db import models


class CVUploadRecord(models.Model):
    user_id = models.CharField(max_length=100)
    username = models.CharField(max_length=150, blank=True)
    file_name = models.CharField(max_length=300)
    file_type = models.CharField(max_length=50)
    chunks_stored = models.IntegerField(default=0)
    cv_summary = models.TextField(blank=True, default="")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.username or self.user_id} - {self.file_name}"
