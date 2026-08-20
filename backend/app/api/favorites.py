from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.database.models import (
    FavoriteMatch,
    Match,
    PredictionRecord,
    User,
)
from app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/favorites",
    tags=["Favorites"],
)


class FavoriteResponse(BaseModel):
    id: int
    match_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class FavoriteTeamResponse(BaseModel):
    id: int
    name: str
    country: str | None
    logo_url: str | None


class FavoriteExpectedGoalsResponse(BaseModel):
    home: float
    away: float
    total: float


class FavoriteProbabilitiesResponse(BaseModel):
    home_win: float
    draw: float
    away_win: float
    over_2_5: float
    under_2_5: float
    btts: float
    no_btts: float


class FavoriteBestPickResponse(BaseModel):
    key: str
    label: str
    probability: float


class FavoriteConfidenceResponse(BaseModel):
    label: str
    score: int


class FavoriteLatestPredictionResponse(BaseModel):
    prediction_record_id: int
    expected_goals: FavoriteExpectedGoalsResponse
    probabilities: FavoriteProbabilitiesResponse
    predicted_score: str | None
    best_pick: FavoriteBestPickResponse | None
    confidence: FavoriteConfidenceResponse
    model_version: str


class FavoriteMatchDetailsResponse(BaseModel):
    id: int
    sportmonks_id: int | None
    date: datetime
    status: str | None
    home_score: int | None
    away_score: int | None
    league_name: str | None
    league_logo: str | None
    venue_name: str | None
    home_team: FavoriteTeamResponse
    away_team: FavoriteTeamResponse
    latest_prediction: FavoriteLatestPredictionResponse | None


class FavoriteListResponse(BaseModel):
    id: int
    match_id: int
    created_at: datetime
    match: FavoriteMatchDetailsResponse


class FavoriteStatusResponse(BaseModel):
    match_id: int
    is_favorite: bool


def _complement_probability(
    value: float,
) -> float:
    return max(
        0.0,
        min(
            100.0,
            100.0 - float(value),
        ),
    )


@router.get(
    "",
    response_model=list[FavoriteListResponse],
)
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FavoriteListResponse]:
    favorites = (
        db.query(FavoriteMatch)
        .options(
            joinedload(FavoriteMatch.match)
            .joinedload(Match.home_team),
            joinedload(FavoriteMatch.match)
            .joinedload(Match.away_team),
        )
        .filter(
            FavoriteMatch.user_id == current_user.id,
        )
        .order_by(
            FavoriteMatch.created_at.desc(),
            FavoriteMatch.id.desc(),
        )
        .all()
    )

    match_ids = [
        favorite.match_id
        for favorite in favorites
    ]

    latest_by_match: dict[int, PredictionRecord] = {}

    if match_ids:
        prediction_records = (
            db.query(PredictionRecord)
            .filter(
                PredictionRecord.match_id.in_(
                    match_ids,
                ),
            )
            .order_by(
                PredictionRecord.match_id.asc(),
                PredictionRecord.created_at.desc(),
                PredictionRecord.id.desc(),
            )
            .all()
        )

        for record in prediction_records:
            if record.match_id not in latest_by_match:
                latest_by_match[
                    record.match_id
                ] = record

    response: list[FavoriteListResponse] = []

    for favorite in favorites:
        match = favorite.match

        if match is None:
            continue

        home_team = match.home_team
        away_team = match.away_team

        if home_team is None or away_team is None:
            continue

        record = latest_by_match.get(
            favorite.match_id,
        )

        latest_prediction = None

        if record is not None:
            best_pick = None

            if (
                record.best_pick_key is not None
                and record.best_pick_label is not None
                and record.best_pick_probability is not None
            ):
                best_pick = FavoriteBestPickResponse(
                    key=record.best_pick_key,
                    label=record.best_pick_label,
                    probability=float(
                        record.best_pick_probability,
                    ),
                )

            latest_prediction = (
                FavoriteLatestPredictionResponse(
                    prediction_record_id=record.id,
                    expected_goals=FavoriteExpectedGoalsResponse(
                        home=float(
                            record.expected_home_goals,
                        ),
                        away=float(
                            record.expected_away_goals,
                        ),
                        total=float(
                            record.expected_total_goals,
                        ),
                    ),
                    probabilities=FavoriteProbabilitiesResponse(
                        home_win=float(
                            record.home_win_probability,
                        ),
                        draw=float(
                            record.draw_probability,
                        ),
                        away_win=float(
                            record.away_win_probability,
                        ),
                        over_2_5=float(
                            record.over_2_5_probability,
                        ),
                        under_2_5=_complement_probability(
                            record.over_2_5_probability,
                        ),
                        btts=float(
                            record.btts_probability,
                        ),
                        no_btts=_complement_probability(
                            record.btts_probability,
                        ),
                    ),
                    predicted_score=record.predicted_score,
                    best_pick=best_pick,
                    confidence=FavoriteConfidenceResponse(
                        label=record.confidence,
                        score=int(
                            record.confidence_score,
                        ),
                    ),
                    model_version=record.model_version,
                )
            )

        response.append(
            FavoriteListResponse(
                id=favorite.id,
                match_id=favorite.match_id,
                created_at=favorite.created_at,
                match=FavoriteMatchDetailsResponse(
                    id=match.id,
                    sportmonks_id=match.sportmonks_id,
                    date=match.date,
                    status=match.status,
                    home_score=match.home_score,
                    away_score=match.away_score,
                    league_name=match.league_name,
                    league_logo=match.league_logo,
                    venue_name=match.venue_name,
                    home_team=FavoriteTeamResponse(
                        id=home_team.id,
                        name=home_team.name,
                        country=home_team.country,
                        logo_url=home_team.logo_url,
                    ),
                    away_team=FavoriteTeamResponse(
                        id=away_team.id,
                        name=away_team.name,
                        country=away_team.country,
                        logo_url=away_team.logo_url,
                    ),
                    latest_prediction=latest_prediction,
                ),
            )
        )

    return response


@router.get(
    "/{match_id}/status",
    response_model=FavoriteStatusResponse,
)
def get_favorite_status(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteStatusResponse:
    exists = (
        db.query(FavoriteMatch.id)
        .filter(
            FavoriteMatch.user_id == current_user.id,
            FavoriteMatch.match_id == match_id,
        )
        .first()
        is not None
    )

    return FavoriteStatusResponse(
        match_id=match_id,
        is_favorite=exists,
    )


@router.post(
    "/{match_id}",
    response_model=FavoriteResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_favorite(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FavoriteMatch:
    match = (
        db.query(Match)
        .filter(Match.id == match_id)
        .first()
    )

    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found.",
        )

    existing = (
        db.query(FavoriteMatch)
        .filter(
            FavoriteMatch.user_id == current_user.id,
            FavoriteMatch.match_id == match_id,
        )
        .first()
    )

    if existing is not None:
        return existing

    favorite = FavoriteMatch(
        user_id=current_user.id,
        match_id=match_id,
    )

    db.add(favorite)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        favorite = (
            db.query(FavoriteMatch)
            .filter(
                FavoriteMatch.user_id == current_user.id,
                FavoriteMatch.match_id == match_id,
            )
            .first()
        )

        if favorite is None:
            raise

        return favorite

    db.refresh(favorite)

    return favorite


@router.delete(
    "/{match_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_favorite(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    favorite = (
        db.query(FavoriteMatch)
        .filter(
            FavoriteMatch.user_id == current_user.id,
            FavoriteMatch.match_id == match_id,
        )
        .first()
    )

    if favorite is None:
        return None

    db.delete(favorite)
    db.commit()

    return None