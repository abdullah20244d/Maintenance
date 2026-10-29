from apps.modules.example.models.example_model import ExampleItem
from apps.core.repositories.base_repository import BaseRepository

class ExampleRepository(BaseRepository[ExampleItem]):
    def __init__(self):
        super().__init__(ExampleItem)

class ExampleService:
    def __init__(self):
        self.repo = ExampleRepository()

    def list_items(self):
        return self.repo.get_all()
