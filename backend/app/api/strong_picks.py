from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.dependencies.subscription import require_premium
from app.services.strong_picks_service import StrongPicksService


router = APIRouter(
    prefix="/strong-picks",
    tags=["Strong Picks"],
)


@router.get(
    "",
    response_model=dict[str, Any],
)
def get_strong_picks(
    count: int = Query(
        default=5,
        ge=StrongPicksService.MIN_COUNT,
        le=StrongPicksService.MAX_COUNT,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
) -> dict[str, Any]:
    """
    Generate a Premium Strong Picks card from the
    strongest qualified Prediction Engine V11 markets.
    """
    _ = current_user

    return StrongPicksService(
        db=db,
    ).build_card(
        count=count,
    )
