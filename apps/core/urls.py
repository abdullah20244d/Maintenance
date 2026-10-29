from django.urls import path
from .views.health import health_check
from .views.settings import system_settings_api

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('settings/', system_settings_api, name='core_settings'),
]
