"""
Main URL Configuration for IT Ticket System
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('config.api_urls')),
    path('accounts/', include('apps.accounts.urls')),
    path('', include('apps.modules.tickets.urls')),
    path('example/', include('apps.modules.example.urls')),
]
