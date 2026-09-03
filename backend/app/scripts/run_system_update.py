from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.config import settings
from app.database.database import SessionLocal
from app.database.models import SystemJob
from app.providers.teams_provider import TeamsProvider
from app.services.job_manager import (
    complete_job,
    create_job,
    fail_job,
    start_job,
)
from app.services.system_update_orchestrator import SystemUpdateOrchestrator


JOB_TYPE = "system_update_auto"


def get_team_ids() -> list[int]:
    """
    Return SportMonks team IDs for the configured
    current competition seasons.
    """

    provider = TeamsProvider()
    team_ids: set[int] = set()

    for competition in (
        settings.sportmonks_competition_scope.values()
    ):
        season_id = competition.get("season_id")

        if (
            not isinstance(season_id, int)
            or season_id <= 0
        ):
            raise RuntimeError(
                "Invalid SportMonks season_id "
                "in competition scope."
            )

        response = provider.get_teams_by_season(
            season_id
        )

        data = (
            response.get("data", [])
            if isinstance(response, dict)
            else []
        )

        if not isinstance(data, list):
            raise RuntimeError(
                f"Invalid teams response for "
                f"season_id={season_id}."
            )

        for team_data in data:
            if not isinstance(team_data, dict):
                continue

            sportmonks_id = team_data.get("id")

            if sportmonks_id is None:
                continue

            try:
                team_id = int(sportmonks_id)
            except (TypeError, ValueError):
                continue

            if team_id > 0:
                team_ids.add(team_id)

    return sorted(team_ids)


def has_active_job(db) -> bool:
    statement = (
        select(SystemJob.id)
        .where(
            SystemJob.job_type.in_(
                (
                    "system_update",
                    JOB_TYPE,
                )
            ),
            SystemJob.status.in_(
                (
                    "pending",
                    "running",
                )
            ),
        )
        .limit(1)
    )

    return db.scalar(statement) is not None


async def run() -> int:
    db = SessionLocal()
    job = None

    try:
        if has_active_job(db):
            print(
                "SKIPPED: another system update job is already active."
            )
            return 0

        team_ids = get_team_ids()

        if not team_ids:
            print(
                "FAILED: no teams with SportMonks IDs were found."
            )
            return 1

        now = datetime.now(timezone.utc)

        start_date = (
            now - timedelta(days=2)
        ).date().isoformat()

        end_date = (
            now + timedelta(days=7)
        ).date().isoformat()

        job = create_job(
            db=db,
            job_type=JOB_TYPE,
            message="Automatic system update queued.",
        )

        start_job(
            db=db,
            job=job,
            message="Automatic system update is running.",
        )

        orchestrator = SystemUpdateOrchestrator(
            db=db
        )

        result = await orchestrator.run(
            team_ids=team_ids,
            start_date=start_date,
            end_date=end_date,
            statistics_limit=20,
            elo_limit=500,
            prediction_limit=200,
            recent_limit=5,
            replace_existing_predictions=False,
        )

        complete_job(
            db=db,
            job=job,
            result=result,
            message="Automatic system update completed.",
        )

        print("=== SYSTEM UPDATE COMPLETE ===")
        print(
            f"teams={len(team_ids)} "
            f"start={start_date} "
            f"end={end_date}"
        )
        print(result.get("summary", {}))

        return 0

    except Exception as error:
        db.rollback()

        if job is not None:
            fail_job(
                db=db,
                job=job,
                error=error,
                message="Automatic system update failed.",
            )

        print(
            f"FAILED: {type(error).__name__}: {error}",
            file=sys.stderr,
        )

        return 1

    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(
        asyncio.run(run())
    )
