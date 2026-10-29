import time
from django.http import JsonResponse

_request_history = {}

class RateLimitMiddleware:
    """
    In-memory IP-based rate limiting to prevent brute force
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        now = time.time()

        if request.path.startswith('/api/public/tickets/track') or request.path.startswith('/api/auth/login'):
            history = _request_history.get(ip, [])
            # Filter entries within the last 60 seconds
            history = [t for t in history if now - t < 60]
            if len(history) >= 20:
                return JsonResponse({'error': 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. يرجى الانتظار دقيقة.'}, status=429)
            history.append(now)
            _request_history[ip] = history

        return self.get_response(request)
