from rest_framework import serializers
from apps.modules.example.models.example_model import ExampleItem

class ExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExampleItem
        fields = ['id', 'uuid', 'title', 'content', 'created_at']
