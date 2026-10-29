from django.urls import path
from .views.ticket_views import home_view, track_page_view, dashboard_page_view

urlpatterns = [
    path('', home_view, name='home'),
    path('track/', track_page_view, name='track_page'),
    path('dashboard/', dashboard_page_view, name='dashboard_page'),
]
