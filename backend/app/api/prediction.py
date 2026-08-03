from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.engine.prediction_engine_v31 import (
    PredictionEngineV31,
)


router = APIRouter(
    prefix="/predict",
    tags=["Predictions"],
)


@router.get(
    "/{match_id}",
    response_model=dict[str, Any],
)
def predict_match(
    match_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    إنشاء توقع لمباراة باستخدام
    Prediction Engine V3.1.
    """

    try:
        engine = PredictionEngineV31(db)

        prediction = engine.predict_match(
            match_id
        )

        return prediction

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "the prediction."
            ),
        ) from error


@router.get(
    "/teams/{home_team_id}/{away_team_id}",
    response_model=dict[str, Any],
)
def predict_teams(
    home_team_id: int,
    away_team_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    إنشاء توقع مباشر بين فريقين.
    """

    if home_team_id == away_team_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Home and away teams "
                "must be different."
            ),
        )

    try:
        engine = PredictionEngineV31(db)

        prediction = engine.predict_teams(
            home_team_id=home_team_id,
            away_team_id=away_team_id,
        )

        return prediction

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "the team prediction."
            ),
        ) from error