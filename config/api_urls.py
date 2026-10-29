"""
Unified API routing table
جدول توجيه API موحد
"""
from django.urls import path, include

urlpatterns = [
    path('core/', include('apps.core.urls')),
    path('auth/', include('apps.accounts.urls_api')),
    path('tickets/', include('apps.modules.tickets.urls_api')),
    path('example/', include('apps.modules.example.urls_api')),
]
