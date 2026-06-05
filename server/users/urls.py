from django.urls import path
from . import views
from . import admin_views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("me/", views.me, name="me"),
    path("logout/", views.logout, name="logout"),
    # Admin endpoints
    path("admin/stats/", admin_views.admin_stats, name="admin-stats"),
    path("admin/users/", admin_views.admin_users, name="admin-users"),
    path("admin/cv-uploads/", admin_views.admin_cv_uploads, name="admin-cv-uploads"),
    path("admin/job-applications/", admin_views.admin_job_applications, name="admin-job-applications"),
    path("admin/change-role/", admin_views.admin_change_role, name="admin-change-role"),
]
