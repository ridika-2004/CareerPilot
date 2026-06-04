from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/cv/', include('cv.urls')),
    path('api/tracker/', include('tracker.urls')),
    # path('api/users/', include('users.urls')), # if you have this
]