from __future__ import annotations

import asyncio
import sys

from app.database.database import SessionLocal
from app.services.system_update_orchestrator import (
    SystemUpdateOrchestrator,
)
from app.services.odds_service import OddsService


PREDICTION_LIMIT = 200


async def run() -> int:
    db = SessionLocal()

    try:
        orchestrator = SystemUpdateOrchestrator(db=db)
        operations: list[dict] = []

        summary = await orchestrator.sync_fixture_context(
            prediction_limit=PREDICTION_LIMIT,
            operations=operations,
        )

        settlement_summary = await orchestrator._refresh_pending_prediction_fixtures(
            prediction_limit=PREDICTION_LIMIT,
            operations=operations,
        )
        evaluation_summary = orchestrator._evaluate_finished_predictions(
            operations=operations,
        )

        odds_summary = await OddsService(db).sync_upcoming(limit=12)

        print("=== FIXTURE CONTEXT UPDATE COMPLETE ===")
        print(summary)
        print("=== PREDICTION SETTLEMENT COMPLETE ===")
        print(settlement_summary)
        print(evaluation_summary)
        print("=== ODDS SYNC COMPLETE ===")
        print(odds_summary)

        if (
            summary.get("failed", 0) > 0
            or settlement_summary.get("failed", 0) > 0
            or evaluation_summary.get("failed", 0) > 0
            or odds_summary.get("failed", 0) > 0
        ):
            return 1

        return 0

    except Exception as error:
        db.rollback()

        print(
            f"FAILED: {type(error).__name__}: {error}",
            file=sys.stderr,
        )

        return 1

    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
