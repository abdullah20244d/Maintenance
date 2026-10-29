from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.core.models.base import BaseModel

class SystemRole(BaseModel):
    """
    Roles: admin, supervisor, technician
    """
    name = models.CharField(max_length=50, unique=True, verbose_name="اسم الدور")
    code = models.CharField(max_length=50, unique=True, verbose_name="رمز الدور")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف والصلاحيات")

    def __str__(self):
        return self.name

class UserProfile(BaseModel):
    """
    Extends user with job metadata, branch, phone
    """
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=30, blank=True, null=True, verbose_name="رقم الهاتف")
    employee_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="الرقم الوظيفي")
    role = models.ForeignKey(SystemRole, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="الدور الفني")
    branch_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="الفرع")

    def __str__(self):
        return f"{self.user.username} ({self.role})"
