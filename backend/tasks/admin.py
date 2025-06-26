from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'completed', 'priority', 'due_date', 'created_at', 'updated_at')
    search_fields = ('title', 'description')
    list_filter = ('completed', 'priority')
    list_editable = ['completed', 'priority']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
