import os
import shutil
import json
from datetime import datetime
from pathlib import Path
from django.conf import settings

class BackupService:
    @staticmethod
    def create_database_backup(destination_dir: str = None) -> str:
        """
        Creates a timestamped snapshot of the SQLite database
        """
        db_path = settings.DATABASES['default']['NAME']
        if not os.path.exists(db_path):
            return ""

        now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        target_dir = Path(destination_dir) if destination_dir else Path(settings.BASE_DIR) / 'backups'
        target_dir.mkdir(parents=True, exist_ok=True)

        backup_file = target_dir / f"tickets_backup_{now_str}.db"
        shutil.copy2(db_path, backup_file)
        return str(backup_file)
