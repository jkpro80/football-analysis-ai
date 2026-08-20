from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.database.models import Match, PredictionRecord
from app.services.backtest_v11_service import BacktestV11Service


router = APIRouter(
    prefix="/prediction-results",
    tags=["Prediction Results"],
)


class PredictionResultTeam(BaseModel):
    id: int
    name: str
    logo_url: str | None = None


class CorrectPredictionResult(BaseModel):
    source: str = "live_prediction"
    match_id: int
    match_date: str

    home_team: PredictionResultTeam
    away_team: PredictionResultTeam

    actual_home_score: int
    actual_away_score: int

    predicted_score: str | None = None

    result_prediction_correct: bool
    exact_score_correct: bool

    confidence_score: int | None = None
    correct_pick_label: str | None = None


def _historical_correct_pick_label(
    *,
    match: Match,
    detail: dict,
) -> str | None:
    predicted = detail.get("predicted") or {}
    correct = detail.get("correct") or {}

    if correct.get("result") is True:
        result = predicted.get("result")

        if result == "home_win":
            return f"فوز {match.home_team.name}"

        if result == "away_win":
            return f"فوز {match.away_team.name}"

        if result == "draw":
            return "التعادل"

    if correct.get("over_2_5") is True:
        if predicted.get("over_2_5") is True:
            return "أكثر من 2.5 هدف"

        return "أقل من 2.5 هدف"

    return None

def _persisted_correct_results(
    db: Session,
    limit: int,
) -> list[CorrectPredictionResult]:
    latest_evaluated_ids = (
        db.query(
            func.max(PredictionRecord.id).label(
                "prediction_id"
            )
        )
        .filter(
            PredictionRecord.evaluated.is_(True),
        )
        .group_by(
            PredictionRecord.match_id,
        )
        .subquery()
    )

    records = (
        db.query(PredictionRecord)
        .join(
            latest_evaluated_ids,
            PredictionRecord.id
            == latest_evaluated_ids.c.prediction_id,
        )
        .options(
            joinedload(
                PredictionRecord.match,
            ).joinedload(
                Match.home_team,
            ),
            joinedload(
                PredictionRecord.match,
            ).joinedload(
                Match.away_team,
            ),
        )
        .filter(
            PredictionRecord.result_prediction_correct.is_(
                True
            ),
            PredictionRecord.actual_home_score.isnot(
                None
            ),
            PredictionRecord.actual_away_score.isnot(
                None
            ),
        )
        .order_by(
            PredictionRecord.created_at.desc(),
            PredictionRecord.id.desc(),
        )
        .limit(limit)
        .all()
    )

    results: list[CorrectPredictionResult] = []

    for record in records:
        match = record.match

        if (
            match is None
            or match.home_team is None
            or match.away_team is None
        ):
            continue

        results.append(
            CorrectPredictionResult(
                source="live_prediction",
                match_id=match.id,
                match_date=match.date.isoformat(),
                home_team=PredictionResultTeam(
                    id=match.home_team.id,
                    name=match.home_team.name,
                    logo_url=match.home_team.logo_url,
                ),
                away_team=PredictionResultTeam(
                    id=match.away_team.id,
                    name=match.away_team.name,
                    logo_url=match.away_team.logo_url,
                ),
                actual_home_score=int(
                    record.actual_home_score
                ),
                actual_away_score=int(
                    record.actual_away_score
                ),
                predicted_score=record.predicted_score,
                result_prediction_correct=True,
                exact_score_correct=(
                    record.exact_score_correct is True
                ),
                confidence_score=(
                    record.confidence_score
                ),
            )
        )

    return results


def _backtest_correct_results(
    db: Session,
    limit: int,
) -> list[CorrectPredictionResult]:
    # Scan more historical matches because not every
    # backtested match will have a correct result prediction.
    scan_limit = min(
        max(limit * 4, 20),
        200,
    )

    report = BacktestV11Service(db).run(
        limit=scan_limit,
        history_limit=5,
        include_details=True,
    )

    if report.get("status") != "success":
        return []

    details = report.get("details") or []

    correct_details = [
        detail
        for detail in details
        if (
            detail.get("correct", {}).get("result")
            is True
            or detail.get("correct", {}).get("over_2_5")
            is True
        )
    ][:limit]

    if not correct_details:
        return []

    match_ids = [
        int(detail["match_id"])
        for detail in correct_details
    ]

    matches = (
        db.query(Match)
        .options(
            joinedload(Match.home_team),
            joinedload(Match.away_team),
        )
        .filter(Match.id.in_(match_ids))
        .all()
    )

    matches_by_id = {
        int(match.id): match
        for match in matches
    }

    results: list[CorrectPredictionResult] = []

    for detail in correct_details:
        match_id = int(detail["match_id"])
        match = matches_by_id.get(match_id)

        if (
            match is None
            or match.home_team is None
            or match.away_team is None
        ):
            continue

        actual = detail.get("actual") or {}
        predicted = detail.get("predicted") or {}
        correct = detail.get("correct") or {}
        confidence = detail.get("confidence") or {}

        confidence_value = confidence.get("value")

        confidence_score = None

        if isinstance(
            confidence_value,
            (int, float),
        ):
            confidence_score = round(
                float(confidence_value) * 100
            )

        results.append(
            CorrectPredictionResult(
                source="live_prediction",
                match_id=match.id,
                match_date=match.date.isoformat(),
                home_team=PredictionResultTeam(
                    id=match.home_team.id,
                    name=match.home_team.name,
                    logo_url=match.home_team.logo_url,
                ),
                away_team=PredictionResultTeam(
                    id=match.away_team.id,
                    name=match.away_team.name,
                    logo_url=match.away_team.logo_url,
                ),
                actual_home_score=int(
                    actual["home_goals"]
                ),
                actual_away_score=int(
                    actual["away_goals"]
                ),
                predicted_score=predicted.get(
                    "score"
                ),
                result_prediction_correct=True,
                exact_score_correct=(
                    correct.get("exact_score")
                    is True
                ),
                confidence_score=confidence_score,
                correct_pick_label=(
                    _historical_correct_pick_label(
                        match=match,
                        detail=detail,
                    )
                ),
            )
        )

    return results


@router.get(
    "/correct",
    response_model=list[CorrectPredictionResult],
    summary="Latest correct prediction results",
)
def get_correct_prediction_results(
    limit: int = Query(
        default=20,
        ge=1,
        le=50,
    ),
    db: Session = Depends(get_db),
) -> list[CorrectPredictionResult]:
    """
    Return correct prediction results.

    Persisted evaluated predictions have priority.

    If no evaluated predictions are currently available,
    historical V11 backtest results are used as a
    read-only fallback.
    """

    persisted = _persisted_correct_results(
        db=db,
        limit=limit,
    )

    if persisted:
        return persisted

    historical = _backtest_correct_results(
        db=db,
        limit=limit,
    )

    return [
        item.model_copy(
            update={
                "source": "historical_backtest",
            }
        )
        for item in historical
    ]
