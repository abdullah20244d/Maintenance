from django.db import models
from apps.core.models.base import BaseModel

class ExampleItem(BaseModel):
    title = models.CharField(max_length=200, verbose_name="العنوان")
    content = models.TextField(verbose_name="المحتوى")

    def __str__(self):
        return self.title
