from django.db import models
import uuid

class BaseModel(models.Model):
    """
    Abstract base model with universal timestamping and unique UUID
    """
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    is_active = models.BooleanField(default=True, verbose_name="مفعل")

    class Meta:
        abstract = True
