from django.urls import path
from django.urls import include

urlpatterns = [
    path("assistant/",include("assistant.urls")),
]