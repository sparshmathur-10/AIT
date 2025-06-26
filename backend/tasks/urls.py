from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.views.decorators.csrf import csrf_exempt

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('analyze/', csrf_exempt(views.analyze_tasks), name='analyze'),
    path('auth/google/', views.google_login, name='google_login'),
    path('auth/profile/', views.user_profile, name='profile'),
    path('auth/csrf/', views.get_csrf, name='get_csrf'),
    path('test_openai/', views.test_openai, name='test_openai'),
] 