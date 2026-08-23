from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.services.system_update_orchestrator import (
    SystemUpdateOrchestrator,
)


def test_refresh_pending_prediction_fixtures_success():
    db = MagicMock()
    orchestrator = SystemUpdateOrchestrator(db=db)

    orchestrator.sync_service.sync_pending_prediction_fixtures = (
        AsyncMock(
            return_value={
                "status": "success",
                "fixtures_found": 3,
                "updated": 3,
                "created": 0,
                "skipped": 0,
                "failed": 0,
                "results": [
                    {
                        "match_id": 421,
                        "status": "updated",
                    },
                    {
                        "match_id": 434,
                        "status": "updated",
                    },
                    {
                        "match_id": 444,
                        "status": "updated",
                    },
                ],
            }
        )
    )

    operations: list[dict] = []

    result = asyncio.run(
        orchestrator
        ._refresh_pending_prediction_fixtures(
            prediction_limit=100,
            operations=operations,
        )
    )

    assert result == {
        "found": 3,
        "updated": 3,
        "created": 0,
        "skipped": 0,
        "failed": 0,
    }

    orchestrator.sync_service.sync_pending_prediction_fixtures.assert_awaited_once_with(
        limit=100,
    )

    assert operations == [
        {
            "step": "refresh_pending_prediction_fixtures_v11",
            "status": "success",
            "summary": result,
            "errors": [],
        }
    ]


def test_refresh_pending_prediction_fixtures_partial_failure():
    db = MagicMock()
    orchestrator = SystemUpdateOrchestrator(db=db)

    failure = {
        "match_id": 444,
        "sportmonks_id": 19713614,
        "status": "failed",
        "error": "SportMonks unavailable",
    }

    orchestrator.sync_service.sync_pending_prediction_fixtures = (
        AsyncMock(
            return_value={
                "status": "success",
                "fixtures_found": 3,
                "updated": 2,
                "created": 0,
                "skipped": 0,
                "failed": 1,
                "results": [
                    {
                        "match_id": 421,
                        "status": "updated",
                    },
                    {
                        "match_id": 434,
                        "status": "updated",
                    },
                    failure,
                ],
            }
        )
    )

    operations: list[dict] = []

    result = asyncio.run(
        orchestrator
        ._refresh_pending_prediction_fixtures(
            prediction_limit=100,
            operations=operations,
        )
    )

    assert result["found"] == 3
    assert result["updated"] == 2
    assert result["failed"] == 1

    assert operations[0]["status"] == (
        "completed_with_errors"
    )
    assert operations[0]["errors"] == [failure]


def test_refresh_pending_prediction_fixtures_exception():
    db = MagicMock()
    orchestrator = SystemUpdateOrchestrator(db=db)

    orchestrator.sync_service.sync_pending_prediction_fixtures = (
        AsyncMock(
            side_effect=RuntimeError(
                "refresh failed"
            )
        )
    )

    operations: list[dict] = []

    result = asyncio.run(
        orchestrator
        ._refresh_pending_prediction_fixtures(
            prediction_limit=100,
            operations=operations,
        )
    )

    assert result == {
        "found": 0,
        "updated": 0,
        "created": 0,
        "skipped": 0,
        "failed": 1,
    }

    db.rollback.assert_called_once()

    assert operations[0]["step"] == (
        "refresh_pending_prediction_fixtures_v11"
    )
    assert operations[0]["status"] == "failed"
    assert "refresh failed" in operations[0]["error"]