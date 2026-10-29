from django.urls import path
from django.views.generic import TemplateView
from .views.auth_views import api_login, api_logout

urlpatterns = [
    path('login/', TemplateView.as_view(template_name='pages/login.html'), name='login_page'),
]
