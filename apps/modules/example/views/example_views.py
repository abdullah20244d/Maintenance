from django.shortcuts import render
from django.http import JsonResponse
from apps.modules.example.models.example_model import ExampleItem

def example_page_view(request):
    items = ExampleItem.objects.filter(is_active=True)
    return render(request, 'pages/example_page.html', {'items': items})

def example_api_list(request):
    items = list(ExampleItem.objects.filter(is_active=True).values('id', 'title', 'content'))
    return JsonResponse({'items': items})
