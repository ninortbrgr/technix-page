from celery import shared_task
from team.models import TeamMitglied
import logging

logger = logging.getLogger(__name__)


@shared_task
def sync_team_periodically():
    result = TeamMitglied.sync_from_infra()

    if result["success"]:
        logger.info(f"Team synced: {result['message']}")
    else:
        logger.error(f"Team sync failed: {result['message']}")

    return result
