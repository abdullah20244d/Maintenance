from apps.core.models.settings import SystemSetting

class SettingsService:
    @staticmethod
    def get(key: str, default: str = "") -> str:
        try:
            return SystemSetting.objects.get(key=key).value
        except SystemSetting.DoesNotExist:
            return default

    @staticmethod
    def set(key: str, value: str, description: str = ""):
        setting, _ = SystemSetting.objects.update_or_create(
            key=key,
            defaults={'value': str(value), 'description': description}
        )
        return setting
