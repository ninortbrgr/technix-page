import re
from django.db import models

class Gruppe(models.TextChoices):
    LEITUNG = 'leitung', 'Leitung'
    NEU_LEITUNG = 'neu_leitung', 'Neu-Leitung'
    ALT_LEITUNG = 'alt_leitung', 'Alt-Leitung'
    SCHLUESSEL = 'schluessel', 'Schlüsselmenschen'
    MITGLIED = 'mitglied', 'Mitglieder'

GRUPPEN_REIHENFOLGE = {
    'leitung': 0,
    'neu_leitung': 1,
    'alt_leitung': 2,
    'schluessel': 3,
    'mitglied': 4,
}

def klassen_sort_key(mitglied):
    klasse = mitglied.klasse.strip()

    match_vorne = re.match(r'^([A-Za-z]+)(\d+)$', klasse)
    match_hinten = re.match(r'^(\d+)([A-Za-z]*)$', klasse)

    if match_vorne:
        zahl = int(match_vorne.group(2))
        buchstabe = match_vorne.group(1)
    elif match_hinten:
        zahl = int(match_hinten.group(1))
        buchstabe = match_hinten.group(2)
    else:
        zahl = 9999
        buchstabe = klasse

    nachname = mitglied.name.strip().split()[-1]

    return (zahl, buchstabe, nachname)

class TeamMitglied(models.Model):
    gruppe = models.CharField(
        max_length=20,
        choices=Gruppe.choices,
    )
    name = models.CharField(max_length=100)
    klasse = models.CharField(max_length=20)
    zusatzfeld = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    bild = models.ImageField(upload_to='team/', blank=True, null=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['gruppe', 'name']
        verbose_name = 'Team-Mitglied'
        verbose_name_plural = 'Team-Mitglieder'

    def __str__(self):
        return f"{self.name} ({self.get_gruppe_display()})"

class Bewerbung(models.Model):
    vorname = models.CharField(max_length=100)
    nachname = models.CharField(max_length=100)
    klasse = models.CharField(max_length=20)
    geburtsdatum = models.DateField()
    telefonnummer = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    eingegangen_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bewerbung'
        verbose_name_plural = 'Bewerbungen'
        ordering = ['-eingegangen_am']

    def __str__(self):
        return f"{self.vorname} {self.nachname}, {self.klasse}"

class Einstellungen(models.Model):
    wartungsmodus = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Einstellungen'
        verbose_name_plural = 'Einstellungen'

    def __str__(self):
        return 'Einstellungen'

class WallOfHonor(models.Model):
    name = models.CharField(max_length=100)
    text = models.TextField(blank=True)
    bild = models.ImageField(upload_to='honor/', blank=True, null=True)
    reihenfolge = models.PositiveIntegerField(default=0)
    erstellt_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['reihenfolge', 'name']
        verbose_name = 'Wall of Honor Eintrag'
        verbose_name_plural = 'Wall of Honor'

    def __str__(self):
        return self.name