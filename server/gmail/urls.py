from django.urls import path
from .views import GmailAuthURLView, GmailCallbackView, GmailStatusView, GmailScanView

urlpatterns = [
    path("auth-url/", GmailAuthURLView.as_view(), name="gmail-auth-url"),
    path("callback/", GmailCallbackView.as_view(), name="gmail-callback"),
    path("status/", GmailStatusView.as_view(), name="gmail-status"),
    path("scan/", GmailScanView.as_view(), name="gmail-scan"),
]
