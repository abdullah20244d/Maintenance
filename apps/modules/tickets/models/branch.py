from django.db import models
from apps.core.models.base import BaseModel

class Branch(BaseModel):
    name = models.CharField(max_length=150, verbose_name="اسم الفرع أو الشركة")
    code = models.CharField(max_length=50, unique=True, verbose_name="رمز الفرع")
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name="المدينة")

    class Meta:
        verbose_name = "فرع"
        verbose_name_plural = "الفروع والشركات"

    def __str__(self):
        return f"{self.name} ({self.code})"

class Category(BaseModel):
    name = models.CharField(max_length=150, verbose_name="نوع الصيانة")
    icon = models.CharField(max_length=50, default="Monitor", verbose_name="الأيقونة")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف التوضيحي")

    class Meta:
        verbose_name = "نوع صيانة"
        verbose_name_plural = "أنواع الصيانة"

    def __str__(self):
        return self.name
