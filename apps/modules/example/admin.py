from django.contrib import admin
from apps.modules.example.models.example_model import ExampleItem

@admin.register(ExampleItem)
class ExampleItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'is_active')
    search_fields = ('title',)
