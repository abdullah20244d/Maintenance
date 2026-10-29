from django.urls import path
from .views.example_views import example_page_view

urlpatterns = [
    path('', example_page_view, name='example_index'),
]
