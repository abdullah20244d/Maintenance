from django.urls import path
from .views.auth_views import api_login, api_logout

urlpatterns = [
    path('login/', api_login, name='api_auth_login'),
    path('logout/', api_logout, name='api_auth_logout'),
]
