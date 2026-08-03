from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.models import Match


def get_prediction_match(
    db: Session,
    match_id: int,
):
    """
    جلب مباراة واحدة مع بيانات الفريق المضيف
    والفريق الضيف من PostgreSQL.
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


def safe_float(
    value,
    default: float,
) -> float:
    """
    تحويل القيمة إلى float مع استخدام قيمة افتراضية
    عندما تكون القيمة None أو غير صالحة.
    """

    if value is None:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(
    value,
    default: int,
) -> int:
    """
    تحويل القيمة إلى int مع استخدام قيمة افتراضية
    عندما تكون القيمة None أو غير صالحة.
    """

    if value is None:
        return default

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_form(form_value) -> list[float]:
    """
    تحويل الفورمة النصية مثل:
    WDLWW

    إلى قائمة رقمية يفهمها المحرك:
    W = 1.0
    D = 0.5
    L = 0.0
    """

    if not form_value:
        return [0.5, 0.5, 0.5, 0.5, 0.5]

    if isinstance(form_value, list):
        normalized_values: list[float] = []

        for item in form_value:
            try:
                number = float(item)
            except (TypeError, ValueError):
                number = 0.5

            normalized_values.append(
                max(0.0, min(number, 1.0))
            )

        return normalized_values or [
            0.5,
            0.5,
            0.5,
            0.5,
            0.5,
        ]

    form_text = str(form_value).strip().upper()

    form_map = {
        "W": 1.0,
        "D": 0.5,
        "L": 0.0,
    }

    normalized_form = [
        form_map[character]
        for character in form_text
        if character in form_map
    ]

    if not normalized_form:
        return [0.5, 0.5, 0.5, 0.5, 0.5]

    return normalized_form[-5:]


def team_to_prediction_data(team) -> dict:
    """
    تحويل كائن Team القادم من SQLAlchemy
    إلى قاموس يفهمه محرك التوقعات.

    يتم هنا أيضًا استبدال قيم NULL القديمة
    بقيم افتراضية آمنة.
    """

    goals_scored = safe_float(
        team.goals_scored,
        1.5,
    )

    goals_conceded = safe_float(
        team.goals_conceded,
        1.0,
    )

    return {
        "id": team.id,
        "name": team.name,
        "country": team.country,

        "attack": safe_int(
            team.attack,
            80,
        ),

        "defense": safe_int(
            team.defense,
            80,
        ),

        "midfield": safe_int(
            team.midfield,
            80,
        ),

        "elo": safe_int(
            team.elo,
            1800,
        ),

        "home_advantage": safe_float(
            team.home_advantage,
            1.10,
        ),

        "goals_scored": goals_scored,

        "goals_conceded": goals_conceded,

        # V3 statistics

        "form": normalize_form(
            team.form
        ),

        "wins": safe_int(
            team.wins,
            0,
        ),

        "draws": safe_int(
            team.draws,
            0,
        ),

        "losses": safe_int(
            team.losses,
            0,
        ),

        "possession": safe_float(
            team.possession,
            50.0,
        ),

        "shots": safe_float(
            team.shots,
            12.0,
        ),

        "shots_on_target": safe_float(
            team.shots_on_target,
            5.0,
        ),

        "corners": safe_float(
            team.corners,
            5.0,
        ),

        "yellow_cards": safe_float(
            team.yellow_cards,
            2.0,
        ),

        "red_cards": safe_float(
            team.red_cards,
            0.1,
        ),

        "clean_sheets": safe_float(
            team.clean_sheets,
            30.0,
        ),

        "failed_to_score": safe_float(
            team.failed_to_score,
            20.0,
        ),

        "xg": safe_float(
            team.xg,
            goals_scored,
        ),

        "xga": safe_float(
            team.xga,
            goals_conceded,
        ),
    }