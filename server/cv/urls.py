from django.urls import path
from .views import CVUploadView, CVAskView, CVStatusView

urlpatterns = [
    path('upload/', CVUploadView.as_view(), name='cv-upload'),
    path('ask/', CVAskView.as_view(), name='cv-ask'),
    path('status/', CVStatusView.as_view(), name='cv-status'),
]