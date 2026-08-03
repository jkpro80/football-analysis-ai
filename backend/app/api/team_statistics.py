from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    Match,
    MatchStatistic,
    Team,
)


router = APIRouter(
    prefix="/teams",
    tags=["Team Statistics"],
)


@router.get(
    "/{team_id}/statistics",
    response_model=dict[str, Any],
)
def get_team_statistics(
    team_id: int,
    last_matches: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    حساب إحصاءات الفريق اعتمادًا على آخر
    المباريات التي تحتوي على نتيجة نهائية.
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

        matches = (
            db.query(Match)
            .filter(
                or_(
                    Match.home_team_id
                    == team_id,
                    Match.away_team_id
                    == team_id,
                ),
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(last_matches)
            .all()
        )

        played = len(matches)
        wins = 0
        draws = 0
        losses = 0

        goals_scored = 0
        goals_conceded = 0

        form: list[str] = []
        recent_matches: list[
            dict[str, Any]
        ] = []

        match_ids: list[int] = []

        for match in matches:
            match_ids.append(match.id)

            is_home = (
                match.home_team_id
                == team_id
            )

            if is_home:
                team_score = int(
                    match.home_score or 0
                )

                opponent_score = int(
                    match.away_score or 0
                )

                opponent_id = (
                    match.away_team_id
                )

                venue = "home"

            else:
                team_score = int(
                    match.away_score or 0
                )

                opponent_score = int(
                    match.home_score or 0
                )

                opponent_id = (
                    match.home_team_id
                )

                venue = "away"

            goals_scored += team_score
            goals_conceded += (
                opponent_score
            )

            if team_score > opponent_score:
                result = "W"
                wins += 1

            elif team_score == opponent_score:
                result = "D"
                draws += 1

            else:
                result = "L"
                losses += 1

            form.append(result)

            opponent = db.get(
                Team,
                opponent_id,
            )

            recent_matches.append(
                {
                    "match_id": match.id,
                    "date": match.date,
                    "status": match.status,
                    "venue": venue,
                    "opponent_id": (
                        opponent_id
                    ),
                    "opponent_name": (
                        opponent.name
                        if opponent
                        else "Unknown"
                    ),
                    "team_score": (
                        team_score
                    ),
                    "opponent_score": (
                        opponent_score
                    ),
                    "result": result,
                }
            )

        average_goals_scored = (
            round(
                goals_scored / played,
                2,
            )
            if played > 0
            else 0.0
        )

        average_goals_conceded = (
            round(
                goals_conceded / played,
                2,
            )
            if played > 0
            else 0.0
        )

        points = (
            wins * 3
            + draws
        )

        maximum_points = (
            played * 3
        )

        form_rating = (
            round(
                points
                / maximum_points
                * 100
            )
            if maximum_points > 0
            else 0
        )

        match_statistics: list[
            MatchStatistic
        ] = []

        if match_ids:
            match_statistics = (
                db.query(MatchStatistic)
                .filter(
                    MatchStatistic.team_id
                    == team_id,
                    MatchStatistic.fixture_id.in_(
                        match_ids
                    ),
                )
                .all()
            )

        average_possession = (
            calculate_average(
                [
                    item.possession
                    for item
                    in match_statistics
                ]
            )
        )

        average_corners = (
            calculate_average(
                [
                    item.corners
                    for item
                    in match_statistics
                ]
            )
        )

        average_yellow_cards = (
            calculate_average(
                [
                    item.yellow_cards
                    for item
                    in match_statistics
                ]
            )
        )

        average_red_cards = (
            calculate_average(
                [
                    item.red_cards
                    for item
                    in match_statistics
                ]
            )
        )

        calculated_attack = (
            calculate_attack_rating(
                average_goals_scored=(
                    average_goals_scored
                ),
                form_rating=form_rating,
                stored_attack=int(
                    team.attack or 80
                ),
            )
        )

        calculated_defense = (
            calculate_defense_rating(
                average_goals_conceded=(
                    average_goals_conceded
                ),
                form_rating=form_rating,
                stored_defense=int(
                    team.defense or 80
                ),
            )
        )

        calculated_midfield = (
            calculate_midfield_rating(
                average_possession=(
                    average_possession
                ),
                form_rating=form_rating,
                stored_midfield=int(
                    team.midfield or 80
                ),
            )
        )

        return {
            "team_id": team.id,
            "sportmonks_id": (
                team.sportmonks_id
            ),
            "team_name": team.name,
            "country": team.country,
            "requested_matches": (
                last_matches
            ),
            "played": played,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "points": points,
            "maximum_points": (
                maximum_points
            ),
            "goals_scored": (
                goals_scored
            ),
            "goals_conceded": (
                goals_conceded
            ),
            "goal_difference": (
                goals_scored
                - goals_conceded
            ),
            "average_goals_scored": (
                average_goals_scored
            ),
            "average_goals_conceded": (
                average_goals_conceded
            ),
            "form": form,
            "form_string": (
                "".join(form)
            ),
            "form_rating": (
                form_rating
            ),
            "calculated_ratings": {
                "attack": (
                    calculated_attack
                ),
                "defense": (
                    calculated_defense
                ),
                "midfield": (
                    calculated_midfield
                ),
                "elo": int(
                    team.elo or 1800
                ),
            },
            "match_averages": {
                "possession": (
                    average_possession
                ),
                "corners": (
                    average_corners
                ),
                "yellow_cards": (
                    average_yellow_cards
                ),
                "red_cards": (
                    average_red_cards
                ),
            },
            "stored_team_statistics": {
                "goals_scored": float(
                    team.goals_scored
                    or 0
                ),
                "goals_conceded": float(
                    team.goals_conceded
                    or 0
                ),
                "form": (
                    team.form or ""
                ),
                "wins": int(
                    team.wins or 0
                ),
                "draws": int(
                    team.draws or 0
                ),
                "losses": int(
                    team.losses or 0
                ),
                "possession": float(
                    team.possession or 0
                ),
                "shots": float(
                    team.shots or 0
                ),
                "shots_on_target": float(
                    team.shots_on_target
                    or 0
                ),
                "corners": float(
                    team.corners or 0
                ),
                "yellow_cards": float(
                    team.yellow_cards
                    or 0
                ),
                "red_cards": float(
                    team.red_cards or 0
                ),
                "clean_sheets": float(
                    team.clean_sheets
                    or 0
                ),
                "failed_to_score": float(
                    team.failed_to_score
                    or 0
                ),
                "xg": float(
                    team.xg or 0
                ),
                "xga": float(
                    team.xga or 0
                ),
            },
            "recent_matches": (
                recent_matches
            ),
        }

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load team "
                "statistics from the database."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to calculate "
                "team statistics."
            ),
        ) from error


def calculate_average(
    values: list[float | None],
) -> float | None:
    """
    حساب المتوسط مع تجاهل القيم الفارغة.
    """

    valid_values = [
        float(value)
        for value in values
        if value is not None
    ]

    if not valid_values:
        return None

    return round(
        sum(valid_values)
        / len(valid_values),
        2,
    )


def calculate_attack_rating(
    average_goals_scored: float,
    form_rating: int,
    stored_attack: int,
) -> int:
    """
    حساب تقييم هجومي مبدئي.
    """

    goals_rating = min(
        average_goals_scored
        / 3.0
        * 100,
        100,
    )

    rating = (
        goals_rating * 0.45
        + form_rating * 0.25
        + stored_attack * 0.30
    )

    return clamp_rating(
        rating
    )


def calculate_defense_rating(
    average_goals_conceded: float,
    form_rating: int,
    stored_defense: int,
) -> int:
    """
    انخفاض الأهداف المستقبلة
    يرفع التقييم الدفاعي.
    """

    conceded_rating = max(
        0,
        100
        - (
            average_goals_conceded
            / 3.0
            * 100
        ),
    )

    rating = (
        conceded_rating * 0.45
        + form_rating * 0.20
        + stored_defense * 0.35
    )

    return clamp_rating(
        rating
    )


def calculate_midfield_rating(
    average_possession: float | None,
    form_rating: int,
    stored_midfield: int,
) -> int:
    """
    حساب تقييم خط الوسط من الاستحواذ
    والحالة الحالية والقيمة المخزنة.
    """

    possession_rating = (
        average_possession
        if average_possession is not None
        else stored_midfield
    )

    rating = (
        possession_rating * 0.35
        + form_rating * 0.20
        + stored_midfield * 0.45
    )

    return clamp_rating(
        rating
    )


def clamp_rating(
    value: float,
) -> int:
    """
    إبقاء التقييم بين صفر ومئة.
    """

    return round(
        max(
            0,
            min(value, 100),
        )
    )