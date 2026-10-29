from django.http import JsonResponse
from apps.core.models.settings import SystemSetting
from apps.core.utils.response import success_response

def system_settings_api(request):
    settings_dict = {s.key: s.value for s in SystemSetting.objects.filter(is_active=True)}
    return success_response(data=settings_dict)
