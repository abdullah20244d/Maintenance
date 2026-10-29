from django import forms
from apps.modules.example.models.example_model import ExampleItem

class ExampleForm(forms.ModelForm):
    class Meta:
        model = ExampleItem
        fields = ['title', 'content']
