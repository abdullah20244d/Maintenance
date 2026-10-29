from django.urls import path
from .views.api_views import public_config_api, create_ticket_api, track_ticket_api

urlpatterns = [
    path('config/', public_config_api, name='api_public_config'),
    path('create/', create_ticket_api, name='api_create_ticket'),
    path('track/', track_ticket_api, name='api_track_ticket'),
]
