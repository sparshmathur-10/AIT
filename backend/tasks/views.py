from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.models import User
from django.db.models import Count, Q
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer, UserSerializer
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from decouple import config
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.authentication import BasicAuthentication
from azure.core.exceptions import HttpResponseError
from openai import OpenAI
import os
import time
import httpx


@method_decorator(csrf_exempt, name='dispatch')
class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def toggle(self, request, pk=None):
        task = self.get_object()
        task.completed = not task.completed
        task.save()
        return Response(TaskSerializer(task).data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        tasks = self.get_queryset()
        total = tasks.count()
        completed = tasks.filter(completed=True).count()
        incomplete = total - completed
        
        # Priority breakdown
        priority_stats = tasks.values('priority').annotate(count=Count('id'))
        
        return Response({
            'total': total,
            'completed': completed,
            'incomplete': incomplete,
            'completion_rate': (completed / total * 100) if total > 0 else 0,
            'priority_breakdown': priority_stats
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            tasks = self.get_queryset().filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )
        else:
            tasks = self.get_queryset()
        
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)


def call_github_gpt4o(prompt):
    url = "https://models.github.ai/inference"
    headers = {
        "Authorization": f"Bearer {config('GITHUB_TOKEN')}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "openai/gpt-4o",
        "messages": [
            {"role": "system", "content": ""},
            {"role": "user", "content": prompt}
        ],
        "temperature": 1,
        "max_tokens": 1500,
        "top_p": 1
    }
    with httpx.Client(timeout=30) as client:
        resp = client.post(url, headers=headers, json=data)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


@csrf_exempt
@api_view(['POST'])
@authentication_classes([BasicAuthentication])
@permission_classes([AllowAny])
def analyze_tasks(request):
    """AI analysis of tasks using DeepSeek (GitHub)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        import json
        data = json.loads(request.body)
        tasks = data.get('tasks', [])
        if not tasks:
            return JsonResponse({'error': 'No tasks provided'}, status=400)
        task_text = ', '.join([f"{t['title']} ({'completed' if t['completed'] else 'pending'})" for t in tasks])
        prompt = f"""You are an expert Task Planner and Productivity Coach. Analyze the following tasks and provide comprehensive insights and recommendations.\n\nTASKS TO ANALYZE:\n{task_text}\n\nPlease think in terms of a structured analysis with the following sections:\n\n📊 **PROGRESS OVERVIEW**\n- Total tasks and completion status\n- Completion rate and productivity score\n- Time management assessment\n\n🎯 **PRIORITY ANALYSIS**\n- Identify high-impact vs low-impact tasks\n- Suggest task prioritization strategy\n- Highlight potential bottlenecks\n\n💡 **PRODUCTIVITY INSIGHTS**\n- Work pattern analysis\n- Efficiency recommendations\n- Motivation and momentum assessment\n\n🚀 **ACTIONABLE RECOMMENDATIONS**\n- Next steps for pending tasks\n- Time management tips\n- Productivity hacks specific to this task list\n\nAfter the analysis, provide a short (100 words or less), clear, concise and persuasive explanation as to the plan of action. Keep the analysis concise but insightful. Focus on practical, actionable advice that will help improve productivity and task completion."""
        token = config('GITHUB_TOKEN')
        endpoint = "https://models.github.ai/inference"
        model = "deepseek/DeepSeek-V3-0324"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        data = {
            "messages": [
                {"role": "system", "content": ""},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.8,
            "top_p": 0.1,
            "max_tokens": 2048,
            "model": model
        }
        resp = httpx.post(f"{endpoint}/chat/completions", headers=headers, json=data, timeout=30)
        if resp.status_code >= 500:
            return JsonResponse({'error': f'DeepSeek server error: {resp.status_code} {resp.text}'}, status=resp.status_code)
        if resp.status_code >= 400:
            return JsonResponse({'error': f'Request error: {resp.status_code} {resp.text}'}, status=resp.status_code)
        summary = resp.json()["choices"][0]["message"]["content"]
        return JsonResponse({'summary': summary, 'provider': 'deepseek'})
    except json.JSONDecodeError as e:
        return JsonResponse({'error': f'Invalid JSON: {str(e)}'}, status=400)
    except Exception as e:
        import traceback
        print(f"Error in analyze_tasks: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)


@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})


def test_session(request):
    user = get_user_model().objects.first()
    login(request, user)
    return JsonResponse({'ok': True})


@csrf_exempt
def google_login(request):
    import json
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from django.contrib.auth import get_user_model, login

    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    token = request.POST.get('credential')
    if not token and request.body:
        try:
            data = json.loads(request.body)
            token = data.get('credential')
        except Exception:
            token = None
    if not token:
        return JsonResponse({'error': 'Missing credential'}, status=400)
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), "938526209070-p87aip5pgetff98rkenmk6ki6hnmorh5.apps.googleusercontent.com")
        email = idinfo.get('email')
        name = idinfo.get('name') or email.split('@')[0]
        if not email:
            return JsonResponse({'error': 'No email in token'}, status=400)
        User = get_user_model()
        user, created = User.objects.get_or_create(username=email, defaults={'email': email, 'first_name': name})
        login(request, user)
        request.session.save()
        return JsonResponse({'message': 'Google login successful', 'user': {'id': user.id, 'username': user.username, 'email': user.email}})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=401)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
def test_openai(request):
    print("About to call OpenAI at", time.time(), flush=True)
    client = OpenAI(
        base_url="https://models.github.ai/inference",
        api_key=config('GITHUB_TOKEN'),
    )
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": ""},
            {"role": "user", "content": "What is the capital of France?"},
        ],
        model="openai/gpt-4o",
        temperature=1,
        max_tokens=100,
        top_p=1
    )
    print("OpenAI call finished at", time.time(), flush=True)
    return JsonResponse({"result": response.choices[0].message.content})
