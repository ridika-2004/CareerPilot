from django.urls import path

from .views import *

urlpatterns = [

    path("sessions/",get_sessions),
    path("sessions/create/",create_session),
    path("sessions/<str:session_id>/",get_session),
    path("sessions/<str:session_id>/rename/",rename_session),
    path("sessions/<str:session_id>/delete/",delete_session),
    path("chat/",send_message),
    path("hunt/",hunt_jobs_view),
]