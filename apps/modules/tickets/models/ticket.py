from django.db import models
from django.contrib.auth.models import User
from apps.core.models.base import BaseModel
from .branch import Branch, Category

class PriorityChoice(models.TextChoices):
    URGENT = 'urgent', 'مستعجلة جداً'
    HIGH = 'high', 'عالية'
    NORMAL = 'normal', 'عادية'
    LOW = 'low', 'منخفضة'

class StatusChoice(models.TextChoices):
    NEW = 'new', 'جديد'
    UNDER_REVIEW = 'under_review', 'قيد المراجعة'
    ASSIGNED = 'assigned', 'تم الإسناد إلى فني'
    IN_PROGRESS = 'in_progress', 'جارٍ العمل'
    WAITING_EMPLOYEE = 'waiting_employee', 'بانتظار الموظف'
    WAITING_SPARE_PARTS = 'waiting_spare_parts', 'بانتظار قطعة غيار'
    RESOLVED = 'resolved', 'تمت الصيانة بنجاح'
    CLOSED = 'closed', 'مغلق نهائياً'
    UNREPAIRABLE = 'unrepairable', 'تعذر الإصلاح'

class Ticket(BaseModel):
    ticket_number = models.CharField(max_length=50, unique=True, verbose_name="رقم البلاغ")
    employee_name = models.CharField(max_length=150, verbose_name="اسم الموظف")
    employee_id = models.CharField(max_length=50, verbose_name="الرقم الوظيفي")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='tickets', verbose_name="الفرع")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='tickets', verbose_name="نوع الصيانة")
    custom_category = models.CharField(max_length=150, blank=True, null=True, verbose_name="تحديد الخدمة (أخرى)")
    description = models.TextField(verbose_name="تفاصيل المشكلة")
    priority = models.CharField(max_length=20, choices=PriorityChoice.choices, default=PriorityChoice.NORMAL, verbose_name="الأولوية")
    status = models.CharField(max_length=30, choices=StatusChoice.choices, default=StatusChoice.NEW, verbose_name="الحالة")
    anydesk_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="رقم AnyDesk")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets', verbose_name="الفني المسند إليه")
    
    # Resolution details
    resolution_cause = models.CharField(max_length=255, blank=True, null=True, verbose_name="سبب المشكلة")
    resolution_action = models.TextField(blank=True, null=True, verbose_name="الإجراء المنفذ")
    resolution_parts = models.CharField(max_length=255, blank=True, null=True, verbose_name="القطع المستبدلة")
    unrepairable_reason = models.CharField(max_length=255, blank=True, null=True, verbose_name="سبب تعذر الإصلاح")
    
    # Timestamps
    work_started_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت بدء العمل")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت اكتمال الصيانة")
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت الإغلاق")

    class Meta:
        verbose_name = "بلاغ صيانة"
        verbose_name_plural = "بلاغات الصيانة"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ticket_number} - {self.employee_name} ({self.get_status_display()})"
