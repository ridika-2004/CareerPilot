from django.urls import path
from .views import CVUploadView, CVAskView

urlpatterns = [
    path('upload/', CVUploadView.as_view(), name='cv-upload'),
    path('ask/', CVAskView.as_view(), name='cv-ask'),
]