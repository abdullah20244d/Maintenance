from rest_framework import serializers
from apps.modules.tickets.models.ticket import Ticket
from apps.modules.tickets.models.comment import TicketComment, TicketHistory
from apps.modules.tickets.models.branch import Branch, Category

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'code', 'city', 'is_active']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'description', 'is_active']

class TicketCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketComment
        fields = ['id', 'author_name', 'comment', 'is_internal', 'created_at']

class TicketHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketHistory
        fields = ['id', 'user_name', 'action', 'old_status', 'new_status', 'details', 'created_at']

class TicketSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    technician_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'employee_name', 'employee_id',
            'branch', 'branch_name', 'category', 'category_name',
            'custom_category', 'description', 'priority', 'status',
            'anydesk_id', 'assigned_to', 'technician_name',
            'resolution_cause', 'resolution_action', 'resolution_parts',
            'work_started_at', 'resolved_at', 'closed_at',
            'created_at', 'updated_at'
        ]
