from apps.core.repositories.base_repository import BaseRepository
from apps.modules.tickets.models.ticket import Ticket
from typing import Optional

class TicketRepository(BaseRepository[Ticket]):
    def __init__(self):
        super().__init__(Ticket)

    def get_by_ticket_number(self, ticket_number: str) -> Optional[Ticket]:
        try:
            return Ticket.objects.get(ticket_number__iexact=ticket_number.strip())
        except Ticket.DoesNotExist:
            return None

    def find_matching_ticket(self, ticket_number: str, employee_id: str) -> Optional[Ticket]:
        try:
            return Ticket.objects.get(
                ticket_number__iexact=ticket_number.strip(),
                employee_id=employee_id.strip()
            )
        except Ticket.DoesNotExist:
            return None

    def get_urgent_open_tickets(self):
        return Ticket.objects.filter(
            priority='urgent'
        ).exclude(status__in=['resolved', 'closed']).order_by('created_at')
