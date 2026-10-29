from datetime import datetime
from apps.modules.tickets.models.ticket import Ticket
from apps.modules.tickets.repositories.ticket_repository import TicketRepository
from apps.modules.tickets.models.comment import TicketHistory

class TicketService:
    def __init__(self):
        self.repo = TicketRepository()

    @staticmethod
    def generate_next_ticket_number() -> str:
        year = datetime.now().year
        prefix = f"IT-{year}-"
        last_ticket = Ticket.objects.filter(ticket_number__startswith=prefix).order_by('-id').first()
        next_seq = 101
        if last_ticket and last_ticket.ticket_number:
            parts = last_ticket.ticket_number.split('-')
            if len(parts) == 3 and parts[2].isdigit():
                next_seq = int(parts[2]) + 1
        return f"{prefix}{str(next_seq).zfill(6)}"

    def create_ticket(self, **kwargs) -> Ticket:
        ticket_number = self.generate_next_ticket_number()
        ticket = self.repo.create(ticket_number=ticket_number, **kwargs)
        TicketHistory.objects.create(
            ticket=ticket,
            user_name="النظام",
            action="إنشاء البلاغ",
            new_status="new",
            details="تم استلام البلاغ آلياً من الموظف"
        )
        return ticket
