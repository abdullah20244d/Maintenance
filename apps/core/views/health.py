from django.http import JsonResponse
from datetime import datetime

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'system': 'IT Ticket System',
        'version': '1.0.0-enterprise'
    })
