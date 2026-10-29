from django.db import models
from .base import BaseModel

class SystemSetting(BaseModel):
    """
    Key-Value System configuration settings
    إعدادات المنظومة
    """
    key = models.CharField(max_length=100, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")
    description = models.CharField(max_length=255, blank=True, null=True, verbose_name="الوصف")

    class Meta:
        verbose_name = "إعداد نظام"
        verbose_name_plural = "إعدادات النظام"

    def __str__(self):
        return f"{self.key}: {self.value}"

class LookupCategory(BaseModel):
    """
    Universal lookup classification
    تصنيفات الفئات والأنواع العامة
    """
    code = models.CharField(max_length=50, unique=True, verbose_name="الرمز")
    name = models.CharField(max_length=150, verbose_name="الاسم بالعربية")
    icon = models.CharField(max_length=50, blank=True, null=True, verbose_name="الأيقونة")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف")

    class Meta:
        verbose_name = "تصنيف مرجعي"
        verbose_name_plural = "التصنيفات المرجعية"

    def __str__(self):
        return self.name
