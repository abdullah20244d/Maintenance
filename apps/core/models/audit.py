from django.db import models
from .base import BaseModel

class AuditLog(BaseModel):
    """
    Immutable audit log model tracking all sensitive actions
    سجل التدقيق والمتابعة التاريخي
    """
    user_id = models.IntegerField(null=True, blank=True, verbose_name="معرف المستخدم")
    user_name = models.CharField(max_length=150, default="النظام", verbose_name="اسم المنفذ")
    action = models.CharField(max_length=100, verbose_name="نوع الإجراء")
    target_model = models.CharField(max_length=100, verbose_name="الكيان المستهدف")
    target_id = models.CharField(max_length=100, null=True, blank=True, verbose_name="معرف السجل")
    details = models.TextField(blank=True, null=True, verbose_name="التفاصيل")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="عنوان IP")

    class Meta:
        verbose_name = "سجل تدقيق"
        verbose_name_plural = "سجلات التدقيق"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} بواسطة {self.user_name} في {self.created_at}"
