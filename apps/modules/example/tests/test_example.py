from django.test import TestCase
from apps.modules.example.models.example_model import ExampleItem

class ExampleTest(TestCase):
    def test_example_item(self):
        item = ExampleItem.objects.create(title="عنصر تجريبي", content="محتوى تجريبي")
        self.assertEqual(item.title, "عنصر تجريبي")
