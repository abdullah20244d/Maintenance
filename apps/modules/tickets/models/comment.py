from django.db import models
from django.contrib.auth.models import User
from apps.core.models.base import BaseModel
from .ticket import Ticket

class TicketComment(BaseModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments', verbose_name="البلاغ")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="المستخدم")
    author_name = models.CharField(max_length=150, verbose_name="اسم الكاتب")
    comment = models.TextField(verbose_name="نص الملاحظة")
    is_internal = models.BooleanField(default=False, verbose_name="ملاحظة فنية داخلية (حجب عن الموظف)")

    class Meta:
        verbose_name = "ملاحظة بلاغ"
        verbose_name_plural = "ملاحظات البلاغات"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author_name} على {self.ticket.ticket_number}"

class TicketHistory(BaseModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='history', verbose_name="البلاغ")
    user_id = models.IntegerField(null=True, blank=True)
    user_name = models.CharField(max_length=150, default="النظام")
    action = models.CharField(max_length=100)
    old_status = models.CharField(max_length=50, blank=True, null=True)
    new_status = models.CharField(max_length=50, blank=True, null=True)
    details = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "سجل حركة بلاغ"
        verbose_name_plural = "سجلات حركة البلاغات"
        ordering = ['created_at']
