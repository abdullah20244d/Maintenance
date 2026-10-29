from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.modules.tickets.models.ticket import Ticket
from apps.modules.tickets.models.branch import Branch, Category
from apps.modules.tickets.serializers.ticket_serializer import (
    TicketSerializer, BranchSerializer, CategorySerializer,
    TicketCommentSerializer, TicketHistorySerializer
)
from apps.modules.tickets.services.ticket_service import TicketService

@api_view(['GET'])
@permission_classes([AllowAny])
def public_config_api(request):
    branches = Branch.objects.filter(is_active=True)
    categories = Category.objects.filter(is_active=True)
    return Response({
        'branches': BranchSerializer(branches, many=True).data,
        'categories': CategorySerializer(categories, many=True).data,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_ticket_api(request):
    data = request.data
    service = TicketService()
    ticket = service.create_ticket(
        employee_name=data.get('employee_name', ''),
        employee_id=data.get('employee_id', ''),
        branch_id=data.get('branch_id'),
        category_id=data.get('category_id'),
        custom_category=data.get('custom_category'),
        description=data.get('description', ''),
        priority=data.get('priority', 'normal'),
        anydesk_id=data.get('anydesk_id')
    )
    return Response({'success': True, 'ticket': TicketSerializer(ticket).data}, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def track_ticket_api(request):
    ticket_number = request.data.get('ticket_number', '').strip()
    employee_id = request.data.get('employee_id', '').strip()
    try:
        ticket = Ticket.objects.get(ticket_number__iexact=ticket_number, employee_id=employee_id)
        comments = ticket.comments.filter(is_internal=False)
        history = ticket.history.all()
        return Response({
            'ticket': TicketSerializer(ticket).data,
            'comments': TicketCommentSerializer(comments, many=True).data,
            'history': TicketHistorySerializer(history, many=True).data,
        })
    except Ticket.DoesNotExist:
        return Response({'error': 'لم يتم العثور على بلاغ مطابق للبيانات المدخلة'}, status=404)
