from django.test import TestCase
from apps.modules.tickets.models.branch import Branch, Category
from apps.modules.tickets.models.ticket import Ticket

class TicketFlowTest(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name="الفرع الرئيسي", code="HQ")
        self.category = Category.objects.create(name="أجهزة مكتبية")

    def test_create_ticket(self):
        t = Ticket.objects.create(
            ticket_number="IT-2026-000101",
            employee_name="محمد سالم",
            employee_id="001234",
            branch=self.branch,
            category=self.category,
            description="عطل شاشة",
            priority="normal"
        )
        self.assertEqual(t.ticket_number, "IT-2026-000101")
