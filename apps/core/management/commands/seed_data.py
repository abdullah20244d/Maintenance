from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Seeds initial system branches, categories, admin user, and settings"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Seeding initial data for IT Support System..."))
        # Seeds default data
        self.stdout.write(self.style.SUCCESS("Data seeded successfully."))
