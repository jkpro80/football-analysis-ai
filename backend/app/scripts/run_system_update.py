from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import SystemJob, Team
from app.services.job_manager import (
    complete_job,
    create_job,
    fail_job,
    start_job,
)
from app.services.system_update_orchestrator import SystemUpdateOrchestrator


JOB_TYPE = "system_update_auto"


def get_team_ids(db) -> list[int]:
    statement = (
        select(Team.sportmonks_id)
        .where(Team.sportmonks_id.is_not(None))
        .order_by(Team.id.asc())
    )

    return [
        int(team_id)
        for team_id in db.scalars(statement).all()
        if team_id is not None
    ]


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

        team_ids = get_team_ids(db)

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
