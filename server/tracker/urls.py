from django.urls import path
from .views import (
    JobApplicationView,
    TodoItemView,
    CalendarEventView,
    GoalView,
    DashboardStatsView,
    AINudgesView,
    CustomGoalView
)

urlpatterns = [
    path('applications/', JobApplicationView.as_view(), name='tracker-applications'),
    path('applications/<str:pk>/', JobApplicationView.as_view(), name='tracker-application-detail'),
    path('todos/', TodoItemView.as_view(), name='tracker-todos'),
    path('todos/<str:pk>/', TodoItemView.as_view(), name='tracker-todo-detail'),
    path('events/', CalendarEventView.as_view(), name='tracker-events'),
    path('events/<str:pk>/', CalendarEventView.as_view(), name='tracker-event-detail'),
    path('goal/', GoalView.as_view(), name='tracker-goal'),
    path('goals/', CustomGoalView.as_view(), name='tracker-custom-goals'),
    path('goals/<str:pk>/', CustomGoalView.as_view(), name='tracker-custom-goal-detail'),
    path('dashboard/', DashboardStatsView.as_view(), name='tracker-dashboard'),
    path('nudges/', AINudgesView.as_view(), name='tracker-nudges'),
]
