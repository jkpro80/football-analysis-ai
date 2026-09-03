from __future__ import annotations

from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Match, PredictionRecord, User
from app.dependencies.auth import get_current_user
from app.dependencies.subscription import require_premium
from app.services.prediction_card_service import (
    PredictionCardItemNotFoundError,
    PredictionCardNotFoundError,
    PredictionCardService,
    PredictionCardValidationError,
)


router = APIRouter(
    prefix="/prediction-cards",
    tags=["Prediction Cards"],
)


class PredictionCardCreateRequest(BaseModel):
    title: str | None = Field(
        default=None,
        max_length=200,
    )


class PredictionCardGenerateRequest(BaseModel):
    mode: str = Field(
        default="automatic",
        pattern="^(automatic|today|single|accumulator|elite)$",
    )
    count: int = Field(
        default=5,
        ge=1,
        le=15,
    )
    match_id: int | None = Field(
        default=None,
        gt=0,
    )
    timezone_offset_minutes: int = Field(
        default=0,
        ge=-840, le=840,
    )
    title: str | None = Field(
        default=None,
        max_length=200,
    )

class PredictionCardEligibleMatchResponse(BaseModel):
    id: int
    home_team: str | None
    away_team: str | None
    date: datetime
    status: str
    league_name: str | None
    confidence: float


class PredictionCardItemCreateRequest(BaseModel):
    match_id: int = Field(gt=0)
    market: str
    selection: str
    line: float | None = None


class PredictionCardItemResponse(BaseModel):
    id: int
    match_id: int
    prediction_record_id: int | None

    home_team: str | None
    away_team: str | None
    match_status: str | None
    match_date: datetime | None

    market: str
    selection: str
    line: float | None

    expected_value: float | None
    probability: float
    confidence: float | None
    model_version: str | None
    decimal_odds: float | None = None
    bookmaker_name: str | None = None
    provider_odd_id: int | None = None

    home_score: int | None
    away_score: int | None

    actual_result: str | None
    actual_value: float | None

    evaluation_status: str
    is_correct: bool | None

    created_at: datetime | None

class PredictionCardResponse(BaseModel):
    id: int
    card_number: str
    title: str | None
    status: str

    created_at: datetime | None
    updated_at: datetime | None

    items_count: int
    resolved_count: int
    won_count: int
    lost_count: int

    items: list[PredictionCardItemResponse]

def _service(
    db: Session,
) -> PredictionCardService:
    return PredictionCardService(db)


def _card_response(
    service: PredictionCardService,
    card,
) -> PredictionCardResponse:
    return PredictionCardResponse.model_validate(
        service.serialize_card(card)
    )


def _item_response(
    service: PredictionCardService,
    item,
) -> PredictionCardItemResponse:
    return PredictionCardItemResponse.model_validate(
        service.serialize_item(item)
    )


def _raise_service_error(
    exc: Exception,
) -> None:
    if isinstance(
        exc,
        (
            PredictionCardNotFoundError,
            PredictionCardItemNotFoundError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    if isinstance(
        exc,
        PredictionCardValidationError,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    raise exc


@router.post(
    "",
    response_model=PredictionCardResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_prediction_card(
    payload: PredictionCardCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> PredictionCardResponse:
    service = _service(db)

    try:
        card = service.create_card(
            user=current_user,
            title=payload.title,
        )
    except (
        PredictionCardValidationError,
        PredictionCardNotFoundError,
    ) as exc:
        _raise_service_error(exc)

    return _card_response(
        service,
        card,
    )


@router.get(
    "",
    response_model=list[PredictionCardResponse],
)
def list_prediction_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> list[PredictionCardResponse]:
    service = _service(db)

    try:
        cards = service.list_cards(
            user=current_user,
        )
    except PredictionCardValidationError as exc:
        _raise_service_error(exc)

    return [
        _card_response(service, card)
        for card in cards
    ]


@router.post(
    "/generate",
    response_model=PredictionCardResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_prediction_card(
    payload: PredictionCardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> PredictionCardResponse:
    service = _service(db)

    try:
        mode = payload.mode.strip().lower()

        if mode == "automatic":
            card = service.generate_card(
                user=current_user,
                count=payload.count,
                title=payload.title,
            )
        elif mode == "today":
            card = service.generate_today_card(
                user=current_user,
                count=payload.count,
                title=payload.title,
                timezone_offset_minutes=payload.timezone_offset_minutes,
            )
        elif mode == "single":
            if payload.match_id is None:
                raise PredictionCardValidationError(
                    "match_id is required for single mode."
                )
            card = service.generate_single_match_card(
                user=current_user,
                match_id=payload.match_id,
                count=payload.count,
                title=payload.title,
            )
        elif mode == "accumulator":
            card = service.generate_accumulator_card(
                user=current_user,
                count=payload.count,
                title=payload.title,
            )
        elif mode == "elite":
            card = service.generate_elite_coupon(
                user=current_user,
                count=payload.count,
                title=payload.title,
            )
        else:
            raise PredictionCardValidationError(
                "Unsupported prediction card generation mode."
            )
    except (
        PredictionCardValidationError,
        PredictionCardNotFoundError,
    ) as exc:
        _raise_service_error(exc)

    return _card_response(
        service,
        card,
    )

@router.get(
    "/eligible-matches",
    response_model=list[PredictionCardEligibleMatchResponse],
)
def list_prediction_card_eligible_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> list[PredictionCardEligibleMatchResponse]:
    now = datetime.utcnow()

    matches = (
        db.query(Match)
        .filter(
            Match.date > now,
            Match.status.in_(("1", "scheduled", "ns")),
        )
        .order_by(Match.date.asc(), Match.id.asc())
        .all()
    )

    eligible: list[PredictionCardEligibleMatchResponse] = []

    for match in matches:
        record = (
            db.query(PredictionRecord)
            .filter(PredictionRecord.match_id == match.id)
            .order_by(
                PredictionRecord.created_at.desc(),
                PredictionRecord.id.desc(),
            )
            .first()
        )

        if record is None:
            continue

        confidence = PredictionCardService._normalize_confidence(
            record.confidence_score
        )

        if confidence is None or confidence < 0.75:
            continue

        eligible.append(
            PredictionCardEligibleMatchResponse(
                id=match.id,
                home_team=PredictionCardService._team_name(
                    match.home_team
                ),
                away_team=PredictionCardService._team_name(
                    match.away_team
                ),
                date=match.date,
                status=str(match.status),
                league_name=match.league_name,
                confidence=confidence,
            )
        )

    return eligible


@router.get(
    "/{card_id}",
    response_model=PredictionCardResponse,
)
def get_prediction_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> PredictionCardResponse:
    service = _service(db)

    try:
        card = service.get_card(
            user=current_user,
            card_id=card_id,
        )
    except (
        PredictionCardValidationError,
        PredictionCardNotFoundError,
    ) as exc:
        _raise_service_error(exc)

    return _card_response(
        service,
        card,
    )


@router.delete(
    "/{card_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_prediction_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> Response:
    service = _service(db)

    try:
        service.delete_card(
            user=current_user,
            card_id=card_id,
        )
    except (
        PredictionCardValidationError,
        PredictionCardNotFoundError,
    ) as exc:
        _raise_service_error(exc)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


@router.post(
    "/{card_id}/items",
    response_model=PredictionCardItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_prediction_card_item(
    card_id: int,
    payload: PredictionCardItemCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> PredictionCardItemResponse:
    service = _service(db)

    try:
        item = service.add_item(
            user=current_user,
            card_id=card_id,
            match_id=payload.match_id,
            market=payload.market,
            selection=payload.selection,
            line=payload.line,
        )
    except (
        PredictionCardValidationError,
        PredictionCardNotFoundError,
    ) as exc:
        _raise_service_error(exc)

    return _item_response(
        service,
        item,
    )


@router.delete(
    "/{card_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_prediction_card_item(
    card_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> Response:
    service = _service(db)

    try:
        service.remove_item(
            user=current_user,
            card_id=card_id,
            item_id=item_id,
        )
    except (
        PredictionCardValidationError,
        PredictionCardNotFoundError,
        PredictionCardItemNotFoundError,
    ) as exc:
        _raise_service_error(exc)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
