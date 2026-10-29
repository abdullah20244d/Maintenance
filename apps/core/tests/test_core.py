from django.test import TestCase
from apps.core.models.audit import AuditLog

class CoreModelTest(TestCase):
    def test_audit_log_creation(self):
        log = AuditLog.objects.create(
            action="TEST_ACTION",
            target_model="Ticket",
            target_id="1",
            user_name="admin",
            details="Test details"
        )
        self.assertEqual(log.action, "TEST_ACTION")
