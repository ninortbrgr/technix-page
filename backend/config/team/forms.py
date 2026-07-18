from django import forms
from .models import Bewerbung

class BewerbungForm(forms.ModelForm):
    geburtsdatum = forms.DateField(
        input_formats=['%d.%m.%Y', '%Y-%m-%d'],
        widget=forms.TextInput(attrs={
            'placeholder': 'TT.MM.JJJJ',
            'id': 'geburtsdatum'
        })
    )

    class Meta:
        model = Bewerbung
        fields = ['vorname', 'nachname', 'klasse', 'geburtsdatum', 'telefonnummer', 'email']
        labels = {
            'vorname': 'Vorname',
            'nachname': 'Nachname',
            'klasse': 'Klasse',
            'geburtsdatum': 'Geburtsdatum',
            'telefonnummer': 'Telefonnummer (optional)',
            'email': 'E-Mail-Adresse (optional)',
        }   