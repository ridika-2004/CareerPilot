from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"status": "ok", "message": "Career Pilot API is running"})

urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/assistant/', include('assistant.urls')),
    path('api/cv/', include('cv.urls')),
    path('api/tracker/', include('tracker.urls')),
    path('api/users/', include('users.urls')),
]