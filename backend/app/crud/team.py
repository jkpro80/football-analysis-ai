from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Team


def get_all_teams(db: Session):
    """
    إرجاع جميع الفرق.
    """
    statement = select(Team).order_by(Team.name)

    return db.scalars(statement).all()


def get_team_by_id(
    db: Session,
    team_id: int,
):
    """
    إرجاع فريق حسب المعرف.
    """
    statement = (
        select(Team)
        .where(Team.id == team_id)
    )

    return db.scalar(statement)


def get_team_by_sportmonks_id(
    db: Session,
    sportmonks_id: int,
):
    """
    إرجاع فريق حسب معرف Sportmonks.
    """
    statement = (
        select(Team)
        .where(
            Team.sportmonks_id
            == sportmonks_id
        )
    )

    return db.scalar(statement)