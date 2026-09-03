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
from app.database.models import User
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
    count: int = Field(
        default=5,
        ge=1,
        le=15,
    )
    title: str | None = Field(
        default=None,
        max_length=200,
    )

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

    market: str
    selection: str
    line: float | None

    expected_value: float | None
    probability: float
    confidence: float | None
    model_version: str | None

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
        card = service.generate_card(
            user=current_user,
            count=payload.count,
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
