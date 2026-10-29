from django import forms
from apps.modules.tickets.models.ticket import Ticket

class TicketCreationForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = [
            'employee_name', 'employee_id', 'branch', 'category',
            'custom_category', 'description', 'priority', 'anydesk_id'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4, 'placeholder': 'تفاصيل المشكلة والعطل...'}),
            'employee_name': forms.TextInput(attrs={'placeholder': 'اسم الموظف الثلاثي'}),
            'employee_id': forms.TextInput(attrs={'placeholder': 'الرقم الوظيفي'}),
            'anydesk_id': forms.TextInput(attrs={'placeholder': 'مثال: 948 123 765'}),
        }
