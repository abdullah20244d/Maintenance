from django.urls import path
from .views.example_views import example_api_list

urlpatterns = [
    path('', example_api_list, name='example_api_list'),
]
