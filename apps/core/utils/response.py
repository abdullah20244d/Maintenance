from django.http import JsonResponse

def success_response(data=None, message="تمت العملية بنجاح", status=200):
    payload = {
        'success': True,
        'message': message,
    }
    if data is not None:
        payload['data'] = data
    return JsonResponse(payload, status=status)

def error_response(message="حدث خطأ أثناء معالجة الطلب", errors=None, status=400):
    payload = {
        'success': False,
        'error': message,
    }
    if errors:
        payload['errors'] = errors
    return JsonResponse(payload, status=status)
