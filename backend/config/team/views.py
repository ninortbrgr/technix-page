from django.shortcuts import render
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.utils import timezone
from .models import TeamMitglied, klassen_sort_key
from .forms import BewerbungForm

GRUPPEN_REIHENFOLGE = ['leitung', 'alt_leitung', 'schluessel', 'mitglied']

GRUPPEN_INFO = {
    'leitung': {
        'titel': 'Leitungen',
        'beschreibung': 'Die Leitungen koordinieren das Team, planen Aufbauten und sind die ersten Ansprechpartner.',
        'grid': 'grid-3',
    },
    'alt_leitung': {
        'titel': 'Alt-Leitungen',
        'beschreibung': 'Ehemalige Leitungen mit Erfahrung, die beratend unterstützen.',
        'grid': 'grid-3',
    },
    'schluessel': {
        'titel': 'Schlüsselmenschen',
        'beschreibung': 'Übernehmen Verantwortung und helfen bei internen Entscheidungen.',
        'grid': 'grid-2',
    },
    'mitglied': {
        'titel': 'Mitglieder',
        'beschreibung': 'Unsere Mitglieder, die tatkräftig bei Aufbauten und Veranstaltungen unterstützen.',
        'grid': 'grid-3',
    },
}

def team(request):
    alle = TeamMitglied.objects.all()
    gruppen = []
    for key in GRUPPEN_REIHENFOLGE:
        mitglieder = [m for m in alle if m.gruppe == key]
        if mitglieder:
            mitglieder = sorted(mitglieder, key=klassen_sort_key, reverse=True)
            gruppen.append({
                'key': key,
                'info': GRUPPEN_INFO[key],
                'mitglieder': mitglieder,
            })
    return render(request, 'team/team.html', {'gruppen': gruppen})

def index(request):
    return render(request, 'pages/index.html')

def einblicke(request):
    return render(request, 'pages/einblicke.html')

def dokumente(request):
    return render(request, 'pages/dokumente.html')

def inventar(request):
    return render(request, 'pages/inventar.html')

def impressum(request):
    return render(request, 'pages/impressum.html')

def anmeldung(request):
    form = BewerbungForm()
    erfolg = False
    fehler = None

    if request.method == 'POST':
        jetzt = timezone.now()
        letzte_bewerbungen = request.session.get('bewerbungen', [])

        letzte_bewerbungen = [
            b for b in letzte_bewerbungen
            if jetzt.timestamp() - b < 3600
        ]

        if len(letzte_bewerbungen) >= 3:
            fehler = 'Du hast bereits zu viele Bewerbungen abgeschickt. Bitte versuche es in einer Stunde nochmal.'
        else:
            form = BewerbungForm(request.POST)
            if form.is_valid():
                bewerbung = form.save()

                letzte_bewerbungen.append(jetzt.timestamp())
                request.session['bewerbungen'] = letzte_bewerbungen

                admins = User.objects.filter(is_staff=True).values_list('email', flat=True)
                admins = [e for e in admins if e]

                if admins:
                    # send_mail(
                        subject=f'Neue Anmeldung von {bewerbung.vorname} {bewerbung.nachname}',
                        message=f'''Es gibt eine neue Anmeldung!

Name: {bewerbung.vorname} {bewerbung.nachname}
Klasse: {bewerbung.klasse}
Geburtsdatum: {bewerbung.geburtsdatum}
Telefon: {bewerbung.telefonnummer or "–"}
E-Mail: {bewerbung.email or "–"}

Im Admin ansehen: http://127.0.0.1:8000/admin/team/bewerbung/
''',
                        from_email=None,
                        recipient_list=list(admins),
#                    ) 
# To get "send_mail" work, update the .env file with correct passwort and mail and delete # in line 104 and 90

                erfolg = True
                form = BewerbungForm()

    return render(request, 'pages/anmeldung.html', {'form': form, 'erfolg': erfolg, 'fehler': fehler})