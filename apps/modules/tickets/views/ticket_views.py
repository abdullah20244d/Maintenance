from django.shortcuts import render, get_object_or_404
from apps.modules.tickets.models.ticket import Ticket
from apps.modules.tickets.models.branch import Branch, Category
from apps.core.models.settings import SystemSetting

def home_view(request):
    branches = Branch.objects.filter(is_active=True)
    categories = Category.objects.filter(is_active=True)
    settings = {s.key: s.value for s in SystemSetting.objects.filter(is_active=True)}
    return render(request, 'pages/index.html', {
        'branches': branches,
        'categories': categories,
        'settings': settings
    })

def track_page_view(request):
    return render(request, 'pages/track.html')

def dashboard_page_view(request):
    return render(request, 'pages/dashboard.html')
