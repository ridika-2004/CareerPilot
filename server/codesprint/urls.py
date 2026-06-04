from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/assistant/', include('assistant.urls')),
    path('api/cv/', include('cv.urls')),
    path('api/tracker/', include('tracker.urls')),
    path('api/users/', include('users.urls')),
]