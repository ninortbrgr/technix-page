from django.core.management.base import BaseCommand
from team.models import TeamMitglied


class Command(BaseCommand):
    help = "Sync team members from Infra"

    def add_arguments(self, parser):
        parser.add_argument(
            "--api-url",
            type=str,
            help="Override the API URL",
        )
        parser.add_argument(
            "--token",
            type=str,
            help="Override the auth token",
        )
        parser.add_argument(
            "--no-delete-missing",
            action="store_false",
            dest="delete_missing",
            help="Do not delete local users that are missing from Infra",
        )

    def handle(self, *args, **options):
        api_url = options.get("api_url")
        token = options.get("token")
        delete_missing = options.get("delete_missing", True)

        result = TeamMitglied.sync_from_infra(
            api_url=api_url,
            auth_token=token,
            delete_missing=delete_missing,
        )

        if result["success"]:
            self.stdout.write(self.style.SUCCESS(result["message"]))
        else:
            self.stdout.write(self.style.ERROR(result["message"]))
