from apps.core.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log(action: str, target_model: str, target_id: str = None, user_id: int = None, user_name: str = "النظام", details: str = "", ip_address: str = None):
        return AuditLog.objects.create(
            action=action,
            target_model=target_model,
            target_id=str(target_id) if target_id else None,
            user_id=user_id,
            user_name=user_name,
            details=details,
            ip_address=ip_address
        )
