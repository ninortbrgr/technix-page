import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.db import models


class Gruppe(models.TextChoices):
    LEITUNG = "leitung", "Leitung"
    ALT_LEITUNG = "alt_leitung", "Alt-Leitung"
    SCHLUESSEL = "schluessel", "Schlüsselmenschen"
    MITGLIED = "mitglied", "Mitglieder"


GRUPPEN_REIHENFOLGE = {
    "leitung": 0,
    "alt_leitung": 1,
    "schluessel": 2,
    "mitglied": 3,
}


def klassen_sort_key(mitglied):
    klasse = mitglied.klasse.strip()

    match_vorne = re.match(r"^([A-Za-z]+)(\d+)$", klasse)  # Q12, Q13
    match_hinten = re.match(r"^(\d+)([A-Za-z]*)$", klasse)  # 10B, 11A

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
    bild = models.ImageField(upload_to="team/", blank=True, null=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)

    technix_user_id = models.IntegerField(unique=True, null=True, blank=True)

    class Meta:
        ordering = ["gruppe", "name"]
        verbose_name = "Team-Mitglied"
        verbose_name_plural = "Team-Mitglieder"

    def __str__(self):
        return f"{self.name} ({self.get_gruppe_display()})"

    @classmethod
    def sync_from_infra(cls, api_url=None, auth_token=None, delete_missing=True):
        if not api_url:
            api_url = getattr(
                settings, "INFRA_SYNC_URL", "http://localhost:8000/api/technix-users/"
            )

        if not auth_token:
            auth_token = getattr(settings, "INFRA_API_TOKEN", None)

        headers = {
            "Accept": "application/json",
            "User-Agent": "TechnixPageSync/1.0",
        }
        if auth_token:
            headers["Authorization"] = f"Token {auth_token}"

        request_obj = Request(api_url, headers=headers, method="GET")

        try:
            with urlopen(request_obj, timeout=10) as response:
                raw_body = response.read()
                decoded = raw_body.decode("utf-8")
                user_data = json.loads(decoded)

            if isinstance(user_data, dict) and "result" in user_data:
                user_data = user_data["result"]

            if not isinstance(user_data, list):
                return {
                    "success": False,
                    "message": "Unexpected response shape from Infra API",
                }

            synced_count = 0
            remote_ids = set()
            for user in user_data:
                if not isinstance(user, dict) or user.get("id") is None:
                    continue

                user_id = user["id"]
                first_name = user.get("first_name", "")
                last_name = user.get("last_name", "")
                full_name = f"{first_name} {last_name}".strip() or user.get("username", "")

                gruppe = cls._determine_group(user.get("groups", []))
                cls.objects.update_or_create(
                    technix_user_id=user_id,
                    defaults={
                        "name": full_name,
                        "klasse": user.get("klasse", ""),
                        "email": user.get("email", ""),
                        "gruppe": gruppe,
                    },
                )
                remote_ids.add(user_id)
                synced_count += 1

            deleted_count = 0
            if delete_missing:
                deleted_count, _ = cls.objects.filter(
                    technix_user_id__isnull=False
                ).exclude(technix_user_id__in=remote_ids).delete()

            return {
                "success": True,
                "synced": synced_count,
                "deleted": deleted_count,
                "message": (
                    f"Successfully synced {synced_count} team members"
                    + (f" and deleted {deleted_count} missing users" if delete_missing else "")
                ),
            }

        except HTTPError as e:
            return {
                "success": False,
                "message": f"Infra API returned HTTP {e.code}: {e.reason}",
            }
        except URLError as e:
            return {
                "success": False,
                "message": f"Unable to reach Infra API: {e.reason}",
            }
        except ValueError as e:
            return {"success": False, "message": f"Invalid JSON from Infra API: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"Error syncing: {str(e)}"}

    @staticmethod
    def _determine_group(group_list):
        group_map = {
            "leitung": Gruppe.LEITUNG,
            "alt-leitung": Gruppe.ALT_LEITUNG,
            "alt_leitung": Gruppe.ALT_LEITUNG,
            "altleitung": Gruppe.ALT_LEITUNG,
            "alt leitung": Gruppe.ALT_LEITUNG,
            "schluessel": Gruppe.SCHLUESSEL,
            "schlüssel": Gruppe.SCHLUESSEL,
            "schluesselmensch": Gruppe.SCHLUESSEL,
            "schlüsselmensch": Gruppe.SCHLUESSEL,
            "schlüsselmenschen": Gruppe.SCHLUESSEL,
            "mitglied": Gruppe.MITGLIED,
            "mitglieder": Gruppe.MITGLIED,
        }

        normalized_groups = []
        if isinstance(group_list, dict):
            normalized_groups = [group_list]
        elif isinstance(group_list, (list, tuple)):
            normalized_groups = group_list
        elif group_list is not None:
            normalized_groups = [group_list]

        for group in normalized_groups:
            if isinstance(group, dict):
                group_name = (
                    group.get("name")
                    or group.get("title")
                    or group.get("display")
                    or group.get("slug")
                    or ""
                )
            else:
                group_name = str(group)

            normalized = group_name.strip().lower().replace(" ", "_").replace("-", "_")
            normalized = normalized.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")

            if normalized in group_map:
                return group_map[normalized]

        return Gruppe.MITGLIED


class Bewerbung(models.Model):
    vorname = models.CharField(max_length=100)
    nachname = models.CharField(max_length=100)
    klasse = models.CharField(max_length=20)
    geburtsdatum = models.DateField()
    telefonnummer = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    eingegangen_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bewerbung"
        verbose_name_plural = "Bewerbungen"
        ordering = ["-eingegangen_am"]

    def __str__(self):
        return f"{self.vorname} {self.nachname}, {self.klasse}"


class Einstellungen(models.Model):
    wartungsmodus = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Einstellungen"
        verbose_name_plural = "Einstellungen"

    def __str__(self):
        return "Einstellungen"

