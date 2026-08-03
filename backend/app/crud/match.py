from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.models import Match


def get_all_matches(db: Session):
    """
    إرجاع جميع المباريات مع بيانات الفريقين.
    """
    statement = (
        select(Match)
        .options(
            joinedload(Match.home_team),
            joinedload(Match.away_team),
        )
        .order_by(Match.date)
    )

    return db.scalars(statement).unique().all()


def get_match_by_id(
    db: Session,
    match_id: int,
):
    """
    إرجاع مباراة واحدة حسب المعرف
    مع بيانات الفريق المضيف والضيف.
    """
    statement = (
        select(Match)
        .options(
            joinedload(Match.home_team),
            joinedload(Match.away_team),
        )
        .where(Match.id == match_id)
    )

    return db.scalar(statement)


def get_match_by_sportmonks_id(
    db: Session,
    sportmonks_id: int,
):
    """
    إرجاع مباراة حسب معرف Sportmonks.
    """
    statement = (
        select(Match)
        .where(
            Match.sportmonks_id
            == sportmonks_id
        )
    )

    return db.scalar(statement)