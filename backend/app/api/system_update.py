from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.security import verify_admin_api_key
from app.services.prediction_v11_record_service import (
    PredictionV11RecordService,
)
from app.services.system_update_orchestrator import (
    SystemUpdateOrchestrator,
)


router = APIRouter(
    prefix="/system",
    tags=["System Update"],
    dependencies=[Depends(verify_admin_api_key)],
)


def _parse_team_ids(team_ids: str) -> list[int]:
    """
    Convert comma-separated Sportmonks team IDs into a unique list
    of positive integers.
    """

    parsed: list[int] = []
    seen: set[int] = set()

    for raw_value in team_ids.split(","):
        value = raw_value.strip()

        if not value:
            continue

        try:
            team_id = int(value)
        except ValueError as error:
            raise ValueError(
                f"Invalid Sportmonks team id: {value}"
            ) from error

        if team_id <= 0:
            raise ValueError(
                "Sportmonks team IDs must be positive integers."
            )

        if team_id not in seen:
            seen.add(team_id)
            parsed.append(team_id)

    if not parsed:
        raise ValueError(
            "Provide at least one Sportmonks team ID."
        )

    return parsed


@router.post(
    "/update-all",
    response_model=dict[str, Any],
)
async def update_all_system_data(
    team_ids: str = Query(
        ...,
        description=(
            "Comma-separated Sportmonks team IDs, "
            "for example: 2447,939,625"
        ),
    ),
    start_date: str = Query(
        ...,
        description="Fixture start date in YYYY-MM-DD format.",
    ),
    end_date: str = Query(
        ...,
        description="Fixture end date in YYYY-MM-DD format.",
    ),
    statistics_limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    elo_limit: int = Query(
        default=500,
        ge=1,
        le=500,
    ),
    prediction_limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    recent_limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    replace_existing_predictions: bool = Query(
        default=False,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Run the complete platform update workflow through the central
    SystemUpdateOrchestrator.
    """

    try:
        parsed_team_ids = _parse_team_ids(team_ids)
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    orchestrator = SystemUpdateOrchestrator(db=db)

    return await orchestrator.run(
        team_ids=parsed_team_ids,
        start_date=start_date,
        end_date=end_date,
        statistics_limit=statistics_limit,
        elo_limit=elo_limit,
        prediction_limit=prediction_limit,
        recent_limit=recent_limit,
        replace_existing_predictions=(
            replace_existing_predictions
        ),
    )


@router.get(
    "/status",
    response_model=dict[str, Any],
)
def system_status(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Basic backend, database and update-engine health status.
    """

    try:
        db.execute(select(1))

        return {
            "status": "ok",
            "backend": "online",
            "database": "connected",
            "system_update_engine": {
                "name": "SystemUpdateOrchestrator",
                "version": "11",
            },
            "prediction_engine": (
                PredictionV11RecordService.MODEL_VERSION
            ),
        }

    except SQLAlchemyError as error:
        db.rollback()

        raise HTTPException(
            status_code=503,
            detail=(
                "Backend is online but the database "
                "health check failed."
            ),
        ) from error

