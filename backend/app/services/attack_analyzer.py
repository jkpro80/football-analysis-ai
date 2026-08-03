from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any


class AttackAnalyzer:
    """
    V2 attack analyzer.

    The analyzer uses completed historical matches and, when supplied,
    their MatchStatistic rows. Existing callers remain compatible because
    all new arguments are optional.
    """

    DEFAULT_ATTACK_RATING = 80.0
    DEFAULT_XG = 1.30
    DEFAULT_GOALS = 1.30
    DEFAULT_POSSESSION = 50.0
    DEFAULT_CORNERS = 5.0
    DEFAULT_ASSISTS = 0.80
    DEFAULT_DRIBBLES = 50.0

    @staticmethod
    def _safe_float(value: Any, default: float = 0.0) -> float:
        try:
            return default if value is None else float(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _clamp(value: float, minimum: float, maximum: float) -> float:
        return max(minimum, min(value, maximum))

    @staticmethod
    def _weighted_average(
        values: list[float],
        weights: list[float],
        default: float,
    ) -> float:
        if not values or not weights:
            return default

        total_weight = sum(weights)
        if total_weight <= 0:
            return default

        return sum(
            value * weight
            for value, weight in zip(values, weights, strict=False)
        ) / total_weight

    @staticmethod
    def _get_attr(item: Any, name: str, default: Any = None) -> Any:
        if isinstance(item, Mapping):
            return item.get(name, default)
        return getattr(item, name, default)

    @classmethod
    def _build_statistics_index(
        cls,
        statistics: Iterable[Any] | None,
    ) -> dict[tuple[int, int], Any]:
        index: dict[tuple[int, int], Any] = {}

        for row in statistics or []:
            fixture_id = cls._get_attr(row, "fixture_id")
            team_id = cls._get_attr(row, "team_id")

            if fixture_id is None or team_id is None:
                continue

            index[(int(fixture_id), int(team_id))] = row

        return index

    @classmethod
    def analyze(
        cls,
        matches: Iterable[Any] | None,
        team_id: int,
        team: Any = None,
        venue: str | None = None,
        statistics: Iterable[Any] | None = None,
        limit: int = 10,
        exclude_match_id: int | None = None,
    ) -> dict[str, Any]:
        """
        Calculate a leakage-safe attacking profile.

        Notes:
        - `matches` must contain only matches known before the target fixture.
        - `exclude_match_id` gives an additional guard against including the
          fixture currently being predicted.
        - `statistics` may contain MatchStatistic ORM rows or dictionaries.
        """

        safe_limit = max(1, min(int(limit or 10), 30))
        normalized_venue = venue.lower() if isinstance(venue, str) else None

        if normalized_venue not in {None, "home", "away"}:
            raise ValueError("venue must be 'home', 'away', or None.")

        statistics_index = cls._build_statistics_index(statistics)
        samples: list[dict[str, float]] = []

        ordered_matches = list(matches or [])

        # Callers normally provide newest-first matches. Keeping this order
        # allows recent matches to receive the greatest weight.
        for match in ordered_matches:
            match_id = cls._get_attr(match, "id")

            if exclude_match_id is not None and match_id == exclude_match_id:
                continue

            home_score = cls._get_attr(match, "home_score")
            away_score = cls._get_attr(match, "away_score")

            if home_score is None or away_score is None:
                continue

            home_team_id = cls._get_attr(match, "home_team_id")
            away_team_id = cls._get_attr(match, "away_team_id")

            if home_team_id == team_id:
                match_venue = "home"
                goals_for = cls._safe_float(home_score)
            elif away_team_id == team_id:
                match_venue = "away"
                goals_for = cls._safe_float(away_score)
            else:
                continue

            if normalized_venue is not None and match_venue != normalized_venue:
                continue

            statistic = None
            if match_id is not None:
                statistic = statistics_index.get((int(match_id), int(team_id)))

            samples.append(
                {
                    "goals": goals_for,
                    "assists": cls._safe_float(
                        cls._get_attr(statistic, "assists"),
                        goals_for * 0.60,
                    ),
                    "possession": cls._safe_float(
                        cls._get_attr(statistic, "possession"),
                        cls.DEFAULT_POSSESSION,
                    ),
                    "corners": cls._safe_float(
                        cls._get_attr(statistic, "corners"),
                        cls.DEFAULT_CORNERS,
                    ),
                    "successful_dribbles_percentage": cls._safe_float(
                        cls._get_attr(
                            statistic,
                            "successful_dribbles_percentage",
                        ),
                        cls.DEFAULT_DRIBBLES,
                    ),
                }
            )

            if len(samples) >= safe_limit:
                break

        played = len(samples)

        team_attack = cls._safe_float(
            getattr(team, "attack", None),
            cls.DEFAULT_ATTACK_RATING,
        )
        team_xg = cls._safe_float(
            getattr(team, "xg", None),
            cls.DEFAULT_XG,
        )
        team_goals_scored = cls._safe_float(
            getattr(team, "goals_scored", None),
            cls.DEFAULT_GOALS,
        )

        # Newest match gets the highest weight.
        weights = [
            max(0.35, 1.0 - index * 0.08)
            for index in range(played)
        ]

        goals = [sample["goals"] for sample in samples]
        assists = [sample["assists"] for sample in samples]
        possession = [sample["possession"] for sample in samples]
        corners = [sample["corners"] for sample in samples]
        dribbles = [
            sample["successful_dribbles_percentage"]
            for sample in samples
        ]

        average_goals = cls._weighted_average(
            goals,
            weights,
            team_goals_scored,
        )
        average_assists = cls._weighted_average(
            assists,
            weights,
            cls.DEFAULT_ASSISTS,
        )
        average_possession = cls._weighted_average(
            possession,
            weights,
            cls.DEFAULT_POSSESSION,
        )
        average_corners = cls._weighted_average(
            corners,
            weights,
            cls.DEFAULT_CORNERS,
        )
        average_dribbles = cls._weighted_average(
            dribbles,
            weights,
            cls.DEFAULT_DRIBBLES,
        )

        recent_goal_rating = cls._clamp(
            average_goals / 2.5 * 100.0,
            0.0,
            100.0,
        )
        xg_rating = cls._clamp(
            team_xg / 2.5 * 100.0,
            0.0,
            100.0,
        )
        assists_rating = cls._clamp(
            average_assists / 2.0 * 100.0,
            0.0,
            100.0,
        )
        possession_rating = cls._clamp(
            (average_possession - 35.0) / 30.0 * 100.0,
            0.0,
            100.0,
        )
        corners_rating = cls._clamp(
            average_corners / 8.0 * 100.0,
            0.0,
            100.0,
        )
        dribbles_rating = cls._clamp(
            average_dribbles,
            0.0,
            100.0,
        )

        attack_rating = (
            recent_goal_rating * 0.35
            + xg_rating * 0.20
            + assists_rating * 0.15
            + possession_rating * 0.10
            + corners_rating * 0.08
            + dribbles_rating * 0.07
            + team_attack * 0.05
        )

        # Reduce confidence in the calculated rating when there is very
        # little historical data, without discarding the available sample.
        sample_confidence = cls._clamp(played / 5.0, 0.0, 1.0)
        final_rating = (
            attack_rating * sample_confidence
            + team_attack * (1.0 - sample_confidence)
        )

        return {
            "version": "AttackAnalyzer V2",
            "venue": normalized_venue or "all",
            "played": played,
            "goals_for": int(sum(goals)),
            "average_goals": round(average_goals, 3),
            "average_assists": round(average_assists, 3),
            "average_possession": round(average_possession, 2),
            "average_corners": round(average_corners, 2),
            "successful_dribbles_percentage": round(
                average_dribbles,
                2,
            ),
            "xg": round(team_xg, 3),
            "sample_confidence": round(sample_confidence, 3),
            "attack_rating": round(
                cls._clamp(final_rating, 40.0, 100.0),
                2,
            ),
        }