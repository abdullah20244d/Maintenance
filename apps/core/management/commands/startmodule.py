from django.core.management.base import BaseCommand
from pathlib import Path

class Command(BaseCommand):
    help = "Scaffolds a new pluggable business module inside apps/modules/<module_name>"

    def add_arguments(self, parser):
        parser.add_argument('module_name', type=str, help='Name of the module')

    def handle(self, *args, **options):
        module_name = options['module_name'].lower()
        target_dir = Path(f"apps/modules/{module_name}")
        target_dir.mkdir(parents=True, exist_ok=True)
        self.stdout.write(self.style.SUCCESS(f"Module {module_name} scaffolded at {target_dir}"))
