from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from pydantic import (
    BaseModel,
    Field,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Team


router = APIRouter(
    prefix="/teams",
    tags=["Teams"],
)


class TeamUpdateRequest(BaseModel):
    """
    البيانات التي يسمح بتعديلها في الفريق.
    جميع الحقول اختيارية لأن الطلب PATCH.
    """

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    attack: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    defense: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    midfield: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    elo: int | None = Field(
        default=None,
        ge=500,
        le=3000,
    )

    home_advantage: float | None = Field(
        default=None,
        ge=0.5,
        le=2.0,
    )


def serialize_team(
    team: Team,
    include_details: bool = False,
) -> dict[str, Any]:
    """
    تحويل سجل الفريق من SQLAlchemy
    إلى قاموس مناسب لواجهة API.
    """

    data: dict[str, Any] = {
        "id": team.id,
        "sportmonks_id": team.sportmonks_id,
        "name": team.name,
        "country": team.country,
        "attack": team.attack,
        "defense": team.defense,
        "midfield": team.midfield,
        "elo": team.elo,
        "home_advantage": team.home_advantage,
    }

    if include_details:
        data.update(
            {
                "goals_scored": team.goals_scored,
                "goals_conceded": team.goals_conceded,
                "form": team.form,
                "wins": team.wins,
                "draws": team.draws,
                "losses": team.losses,
                "possession": team.possession,
                "shots": team.shots,
                "shots_on_target": (
                    team.shots_on_target
                ),
                "corners": team.corners,
                "yellow_cards": (
                    team.yellow_cards
                ),
                "red_cards": team.red_cards,
                "clean_sheets": (
                    team.clean_sheets
                ),
                "failed_to_score": (
                    team.failed_to_score
                ),
                "xg": team.xg,
                "xga": team.xga,
            }
        )

    return data


@router.get(
    "",
    response_model=list[dict[str, Any]],
)
def get_teams(
    limit: int = Query(
        default=500,
        ge=1,
        le=1000,
    ),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    جلب قائمة الفرق المسجلة في قاعدة البيانات.
    """

    try:
        teams = (
            db.query(Team)
            .order_by(
                Team.name.asc(),
                Team.id.asc(),
            )
            .limit(limit)
            .all()
        )

        return [
            serialize_team(team)
            for team in teams
        ]

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load teams "
                "from the database."
            ),
        ) from error


@router.get(
    "/{team_id}",
    response_model=dict[str, Any],
)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    جلب بيانات فريق واحد بالتفصيل.
    """

    try:
        team = db.get(
            Team,
            team_id,
        )

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load the team "
                "from the database."
            ),
        ) from error

    if team is None:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    return serialize_team(
        team,
        include_details=True,
    )


@router.patch(
    "/{team_id}",
    response_model=dict[str, Any],
)
def update_team(
    team_id: int,
    payload: TeamUpdateRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تعديل بيانات فريق موجود.
    """

    try:
        team = db.get(
            Team,
            team_id,
        )

        if team is None:
            raise HTTPException(
                status_code=404,
                detail="Team not found.",
            )

        update_data = payload.model_dump(
            exclude_unset=True,
        )

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No fields were provided."
                ),
            )

        if "name" in update_data:
            clean_name = (
                update_data["name"].strip()
            )

            if not clean_name:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Team name cannot "
                        "be empty."
                    ),
                )

            duplicate_team = (
                db.query(Team)
                .filter(
                    Team.name == clean_name,
                    Team.id != team_id,
                )
                .first()
            )

            if duplicate_team is not None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Another team already "
                        "uses this name."
                    ),
                )

            update_data["name"] = clean_name

        if "country" in update_data:
            country = update_data["country"]

            update_data["country"] = (
                country.strip()
                if country
                else None
            )

        for field_name, value in (
            update_data.items()
        ):
            setattr(
                team,
                field_name,
                value,
            )

        db.commit()
        db.refresh(team)

        return serialize_team(
            team,
            include_details=True,
        )

    except HTTPException:
        db.rollback()
        raise

    except SQLAlchemyError as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update the team."
            ),
        ) from error