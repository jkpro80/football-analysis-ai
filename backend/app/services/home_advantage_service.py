from typing import Any

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.database.models import Match, Team


class HomeAdvantageService:
    """
    حساب أفضلية الأرض بصورة ديناميكية اعتمادًا على:
    - أداء صاحب الأرض في مبارياته البيتية السابقة.
    - أداء الضيف في مبارياته الخارجية السابقة.
    - النقاط لكل مباراة.
    - نسبة الفوز.
    - متوسط الأهداف المسجلة والمستقبلة.

    يتم استخدام المباريات السابقة فقط لمنع تسرب البيانات.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def calculate(
        self,
        fixture_id: int,
        limit: int = 10,
    ) -> dict[str, Any]:
        fixture = self.db.get(Match, fixture_id)

        if fixture is None:
            raise ValueError(
                "Fixture was not found in the local database."
            )

        home_team = self.db.get(
            Team,
            fixture.home_team_id,
        )
        away_team = self.db.get(
            Team,
            fixture.away_team_id,
        )

        if home_team is None or away_team is None:
            raise ValueError(
                "One or both fixture teams were not found."
            )

        safe_limit = max(3, min(limit, 20))

        home_matches = self._get_venue_matches(
            team_id=int(home_team.id),
            venue="home",
            before_date=fixture.date,
            exclude_fixture_id=int(fixture.id),
            limit=safe_limit,
        )

        away_matches = self._get_venue_matches(
            team_id=int(away_team.id),
            venue="away",
            before_date=fixture.date,
            exclude_fixture_id=int(fixture.id),
            limit=safe_limit,
        )

        home_stats = self._calculate_venue_stats(
            team_id=int(home_team.id),
            matches=home_matches,
        )
        away_stats = self._calculate_venue_stats(
            team_id=int(away_team.id),
            matches=away_matches,
        )

        home_strength = self._calculate_strength(home_stats)
        away_strength = self._calculate_strength(away_stats)
        strength_difference = home_strength - away_strength

        minimum_sample = min(
            int(home_stats["matches_used"]),
            int(away_stats["matches_used"]),
        )
        sample_confidence = min(
            minimum_sample / safe_limit,
            1.0,
        )

        # تقليص أثر المعامل عند قلة المباريات المتاحة.
        dynamic_adjustment = (
            strength_difference
            * 0.12
            * sample_confidence
        )
        base_home_bonus = 0.05 * sample_confidence

        home_multiplier = self._clamp(
            1.0
            + base_home_bonus
            + dynamic_adjustment,
            0.85,
            1.25,
        )

        away_multiplier = self._clamp(
            1.0
            - (base_home_bonus * 0.60)
            - (dynamic_adjustment * 0.80),
            0.80,
            1.15,
        )

        return {
            "fixture_id": int(fixture.id),
            "method": "dynamic venue performance",
            "limit": safe_limit,
            "sample_confidence": round(
                sample_confidence,
                3,
            ),
            "home_multiplier": round(
                home_multiplier,
                3,
            ),
            "away_multiplier": round(
                away_multiplier,
                3,
            ),
            "strength_difference": round(
                strength_difference,
                3,
            ),
            "home": {
                "team_id": int(home_team.id),
                "team_name": home_team.name,
                "venue": "home",
                "strength": round(home_strength, 3),
                **home_stats,
            },
            "away": {
                "team_id": int(away_team.id),
                "team_name": away_team.name,
                "venue": "away",
                "strength": round(away_strength, 3),
                **away_stats,
            },
            "data_leakage_protection": True,
        }

    def _get_venue_matches(
        self,
        team_id: int,
        venue: str,
        before_date: Any,
        exclude_fixture_id: int,
        limit: int,
    ) -> list[Match]:
        if venue == "home":
            venue_condition = Match.home_team_id == team_id
        elif venue == "away":
            venue_condition = Match.away_team_id == team_id
        else:
            raise ValueError("Venue must be 'home' or 'away'.")

        cutoff_condition = or_(
            Match.date < before_date,
            and_(
                Match.date == before_date,
                Match.id < exclude_fixture_id,
            ),
        )

        statement = (
            select(Match)
            .where(
                venue_condition,
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
                cutoff_condition,
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(limit)
        )

        return list(self.db.scalars(statement).all())

    @staticmethod
    def _calculate_venue_stats(
        team_id: int,
        matches: list[Match],
    ) -> dict[str, Any]:
        wins = 0
        draws = 0
        losses = 0
        goals_scored = 0
        goals_conceded = 0

        for match in matches:
            is_home = int(match.home_team_id) == team_id

            team_score = int(
                match.home_score
                if is_home
                else match.away_score
            )
            opponent_score = int(
                match.away_score
                if is_home
                else match.home_score
            )

            goals_scored += team_score
            goals_conceded += opponent_score

            if team_score > opponent_score:
                wins += 1
            elif team_score == opponent_score:
                draws += 1
            else:
                losses += 1

        matches_used = len(matches)
        points = (wins * 3) + draws

        if matches_used == 0:
            return {
                "matches_used": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "points_per_game": 0.0,
                "win_rate": 0.0,
                "average_goals_scored": 0.0,
                "average_goals_conceded": 0.0,
                "goal_difference_per_match": 0.0,
            }

        return {
            "matches_used": matches_used,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "points_per_game": round(
                points / matches_used,
                2,
            ),
            "win_rate": round(
                wins / matches_used * 100,
                2,
            ),
            "average_goals_scored": round(
                goals_scored / matches_used,
                2,
            ),
            "average_goals_conceded": round(
                goals_conceded / matches_used,
                2,
            ),
            "goal_difference_per_match": round(
                (
                    goals_scored
                    - goals_conceded
                )
                / matches_used,
                2,
            ),
        }

    def _calculate_strength(
        self,
        stats: dict[str, Any],
    ) -> float:
        if int(stats["matches_used"]) == 0:
            return 0.5

        points_score = self._clamp(
            float(stats["points_per_game"]) / 3.0,
            0.0,
            1.0,
        )
        win_score = self._clamp(
            float(stats["win_rate"]) / 100.0,
            0.0,
            1.0,
        )
        goal_balance_score = self._clamp(
            (
                float(
                    stats[
                        "goal_difference_per_match"
                    ]
                )
                + 2.0
            )
            / 4.0,
            0.0,
            1.0,
        )

        return (
            points_score * 0.50
            + win_score * 0.30
            + goal_balance_score * 0.20
        )

    @staticmethod
    def _clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        return max(minimum, min(value, maximum))