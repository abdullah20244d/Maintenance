from typing import TypeVar, Generic, List, Optional
from django.db import models

T = TypeVar('T', bound=models.Model)

class BaseRepository(Generic[T]):
    """
    Base Repository Pattern providing standard CRUD operations
    """
    def __init__(self, model_class: type[T]):
        self.model_class = model_class

    def get_all(self, active_only: bool = True) -> models.QuerySet[T]:
        qs = self.model_class.objects.all()
        if active_only and hasattr(self.model_class, 'is_active'):
            qs = qs.filter(is_active=True)
        return qs

    def get_by_id(self, id: int) -> Optional[T]:
        try:
            return self.model_class.objects.get(id=id)
        except self.model_class.DoesNotExist:
            return None

    def create(self, **kwargs) -> T:
        return self.model_class.objects.create(**kwargs)

    def update(self, instance: T, **kwargs) -> T:
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save()
        return instance

    def delete(self, instance: T, soft: bool = True) -> bool:
        if soft and hasattr(instance, 'is_active'):
            instance.is_active = False
            instance.save()
            return True
        instance.delete()
        return True
