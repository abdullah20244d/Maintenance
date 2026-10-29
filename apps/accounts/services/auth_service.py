from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

class AuthService:
    @staticmethod
    def authenticate_technician(username, password):
        return authenticate(username=username, password=password)

    @staticmethod
    def get_user_permissions(user: User):
        if user.is_superuser:
            return ['*']
        if hasattr(user, 'profile') and user.profile.role:
            if user.profile.role.code == 'admin':
                return ['*']
            elif user.profile.role.code == 'supervisor':
                return ['tickets.view', 'tickets.assign', 'tickets.status', 'reports.view']
            elif user.profile.role.code == 'technician':
                return ['tickets.view', 'tickets.status', 'tickets.comment']
        return []
