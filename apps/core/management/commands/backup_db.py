from django.core.management.base import BaseCommand
from apps.core.services.backup_service import BackupService

class Command(BaseCommand):
    help = "Creates a local backup snapshot of the database"

    def handle(self, *args, **options):
        path = BackupService.create_database_backup()
        if path:
            self.stdout.write(self.style.SUCCESS(f"Database backed up to: {path}"))
        else:
            self.stdout.write(self.style.ERROR("Backup failed."))
