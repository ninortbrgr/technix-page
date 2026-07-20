# CSG-TechniX Homepage Source Code

Dieses Repository enthält den Quellcode für die Website des Technikteams des CSG´s. Das System dient dem öffentlichen Auftreten und zur Integration in die Website des CSG´s (https://www.csg-germering.de).

## Tech Stack

*   **Framework:** Django 4.2.30
*   **Verwendete Sprachen:** Python 3.9.6, HTMl, Javascript, CSS
*   **Datenbank:** SQLite
*   **Frontend:** HTML, CSS

## Requirements

Folgende Tools müssen lokal installiert sein, um am Code arbeiten zu können:
*   Python 3.x
*   pip
*   Git
*   [VS Code oder ein anderer Editor]

## Local Setup

**1. Repository klonen**
`git clone https://github.com/ninortbrgr/technix-page.git`
`cd technix-page`

**2. Virtuelle Umgebung (venv) erstellen & aktivieren**
`python -m venv venv`
`source venv/bin/activate`

**3. Abhängigkeiten installieren**
`pip install -r requirements.txt`

**4. Umgebungsvariablen (.env) einrichten**
Erstelle im Projektordner unter `backend/config` eine Datei und nenne sie `.env`
Füge folgendes ein:
  SECRET_KEY= [Füge hier den Django Secret Key ein]

  EMAIL_HOST_USER=[Füge hier ggf. die E-Mail Adresse/den Username ein, mit dem die Anmeldung auf deinem Mail Server funktioniert]

  EMAIL_HOST_PASSWORD=[FÜge hier ggf. das Anwendungspasswort ein, mit dem die Anmeldung auf deinem Mail Server funktioniert]

  DEFAULT_FROM_EMAIL=[Füge hier ggf. die E-Mail Adresse ein, mit der Emails verwendet werden sollen]

  INFRA_SYNC_URL=[Hier die URL auf dem das Infranet läuft + /api/technix-users/ einfügen]

  INFRA_API_TOKEN=[Hier das in der admin oberfläche des Infranets erstellte API token einfügen]
 
**5. Datenbank aufsetzen**
Folgenden Befehl im Projektordner ausführen `python manage.py migrate`

**6. Admin-Zugang erstellen**
`python manage.py createsuperuser`

**7. Server starten**
`cd backend/config`
`python manage.py runserver`
Die Website ist jetzt unter http://127.0.0.1:8000/ erreichbar.

## Feature-Documentation

### 1. Online-Anmeldungsformular (Mitgliedschafts-Bewerbung)
Dieses Formular ermöglicht es Schülern, sich online für das Technikteam zu bewerben. Die Seite enthält fest codierte Kriterien (z. B. Mindestalter ab Jahrgangsstufe 7) und ein dynamisches Formular.

#### Datenfluss & Funktionsweise
1. **Anzeige (GET-Request):** Die View rendert das Template und übergibt (falls vorhanden) ein leeres oder vorab ausgefülltes Formular-Objekt (`form`).
2. **Eingabe-Validierung (Client-Side):** 
   * Die HTML5-Attribute `required` verhindern das Absenden leerer Pflichtfelder.
   * Das Geburtsdatum wird über die JavaScript-Bibliothek **Flatpickr** (deutsche Lokalisierung) abgefangen. Es erlaubt eine manuelle Eingabe oder die Auswahl über einen Kalender, wobei Daten in der Zukunft blockiert sind (`maxDate: 'today'`).
3. **Absenden (POST-Request):** 
   * Die Daten werden per `method="post"` **an dieselbe URL** geschickt, auf der sich das Formular befindet (da kein `action`-Attribut im `<form>`-Tag definiert ist, verweist es auf sich selbst).
   * Der Django `{% csrf_token %}` sorgt für den Schutz vor Cross-Site-Request-Forgery.
4. **Erfolgsmeldung:** Wenn die View die Daten erfolgreich verarbeitet hat (z. B. nach dem Speichern in der Datenbank), übergibt sie eine Variable `erfolg = True`. Das Template blendet daraufhin eine grüne Erfolgsmeldung mit dem Hinweis auf das Treffen am Mittwoch in Raum 001 ein.

#### Abgefragte Felder im Detail

| HTML `name` Attribut | Feldtyp | Status | Validierung / Verhalten |
| :--- | :--- | :--- | :--- |
| `vorname` | Text | **Pflichtfeld** | Vorname des Bewerbers. |
| `nachname` | Text | **Pflichtfeld** | Nachname des Bewerbers. |
| `klasse` | Text | **Pflichtfeld** | Schulklasse (z.B. "10B" oder "Q12"). |
| `geburtsdatum` | Text / Date | **Pflichtfeld** | Validiert via Flatpickr (`TT.MM.JJJJ`). |
| `telefonnummer` | Tel | *Optional* | Telefonnummer für eventuelle Rückfragen. |
| `email` | E-Mail | *Optional* | E-Mail-Adresse des Bewerbers. |

---

### 2. Dynamische Teamliste (`Unser Team`)
Die Teamseite wird vollkommen dynamisch generiert. Sie teilt die Mitglieder automatisch in verschiedene Gruppen ein (z. B. Leitung, normale Mitglieder) und passt das Layout (Grid) je nach Gruppe an.

#### Datenstruktur & Backend-Erwartung (Context)
Die View muss dem Template eine Variable namens `gruppen` im Context übergeben. Diese Struktur ist eine Liste von Gruppen-Objekten (oder Dictionaries).

Jedes `gruppe`-Objekt **muss** folgende Struktur aufweisen:
*   **`gruppe.info`:** Ein Unterobjekt mit den Metadaten der Gruppe:
    *   `titel`: Die Überschrift der Gruppe (z. B. "Die Leitung").
    *   `beschreibung`: Ein erklärender Text, der zentriert unter dem Titel steht.
    *   `grid`: Ein CSS-Klassenname (z. B. `grid-3-columns`), der das Layout der Karten steuert.
*   **`gruppe.key`:** Ein Identifikator-String (z. B. `'leitung'`, `'alt_leitung'` oder `'schluessel'`), der steuert, ob bei fehlendem Profilbild ein Platzhalter angezeigt wird.
*   **`gruppe.mitglieder`:** Eine Liste von Personen-Objekten aus der Datenbank.

#### Personen-Daten (Model-Felder)
Jedes Objekt in `gruppe.mitglieder` benötigt folgende Attribute:

| Attribut / Feld | Typ | Anzeige-Logik im Template |
| :--- | :--- | :--- |
| `person.name` | String | Wird immer angezeigt, gefolgt von der Klasse. |
| `person.klasse` | String | Wird direkt neben dem Namen angezeigt. |
| `person.bild` | ImageField | Wenn vorhanden, wird das Bild auf `220px` Höhe gecroppt (`object-fit: cover`). |
| `person.zusatzfeld` | String | *Optional.* Für Sonderrollen (z. B. "Head Developer"). Wird unter dem Namen gerendert. |
| `person.email` | EmailField | *Optional.* Wenn vorhanden, wird ein klickbarer `mailto:`-Link generiert. |

#### Sonderlogik für Bild-Platzhalter
Das Template besitzt eine eingebaute Schutzlogik für das Layout:
1. Hat eine Person ein Bild, wird dieses **immer** angezeigt.
2. Hat eine Person **kein** Bild, wird geprüft, ob sie zu einer kritischen Gruppe gehört (`leitung`, `alt_leitung` oder `schluessel`). Falls ja, wird ein strukturierter **Bild Platzhalter** gerendert, um das Design nicht zu zerschießen.
3. Normale Mitglieder ohne Bild erhalten in diesem Template keinen Platzhalter (die Karte zeigt dann nur den Text).

## Head Developer / Kontakt

Bei Fragen zum Setup oder zur Architektur wende dich an:
**[Nino Reitberger](mailto:nino@rtbrgr.de)** - Head Developer
