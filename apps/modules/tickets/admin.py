from django.contrib import admin
from .models.branch import Branch, Category
from .models.ticket import Ticket
from .models.comment import TicketComment, TicketHistory

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'is_active')
    search_fields = ('name', 'code')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'is_active')

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'employee_name', 'branch', 'category', 'priority', 'status', 'created_at')
    list_filter = ('priority', 'status', 'branch', 'category')
    search_fields = ('ticket_number', 'employee_name', 'employee_id')

@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'author_name', 'is_internal', 'created_at')

@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'action', 'user_name', 'created_at')
