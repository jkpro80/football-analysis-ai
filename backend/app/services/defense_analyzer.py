from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any


class DefenseAnalyzer:
    """
    Defense Analyzer V2.

    Uses completed historical fixtures and optional MatchStatistic rows.
    New arguments are optional, so existing callers remain compatible.
    """

    DEFAULT_DEFENSE_RATING = 75.0
    DEFAULT_XGA = 1.30
    DEFAULT_POSSESSION = 50.0
    DEFAULT_CORNERS_AGAINST = 5.0
    DEFAULT_YELLOW_CARDS = 2.0
    DEFAULT_RED_CARDS = 0.05

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
    def _get_attr(item: Any, name: str, default: Any = None) -> Any:
        if isinstance(item, Mapping):
            return item.get(name, default)
        return getattr(item, name, default)

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
        Build a leakage-safe defensive profile.

        Parameters:
        - matches: historical fixtures, preferably newest first.
        - team_id: team being analysed.
        - team: optional team object containing fallback attributes.
        - venue: "home", "away", or None.
        - statistics: optional MatchStatistic ORM rows or dictionaries.
        - limit: maximum number of historical matches.
        - exclude_match_id: prevents the target fixture being included.
        """

        safe_limit = max(1, min(int(limit or 10), 30))
        normalized_venue = venue.lower() if isinstance(venue, str) else None

        if normalized_venue not in {None, "home", "away"}:
            raise ValueError("venue must be 'home', 'away', or None.")

        statistics_index = cls._build_statistics_index(statistics)
        samples: list[dict[str, float]] = []

        for match in list(matches or []):
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
                opponent_id = away_team_id
                goals_against = cls._safe_float(away_score)
                match_xga = cls._get_attr(match, "home_xga")
            elif away_team_id == team_id:
                match_venue = "away"
                opponent_id = home_team_id
                goals_against = cls._safe_float(home_score)
                match_xga = cls._get_attr(match, "away_xga")
            else:
                continue

            if normalized_venue is not None and match_venue != normalized_venue:
                continue

            own_statistic = None
            opponent_statistic = None

            if match_id is not None:
                own_statistic = statistics_index.get(
                    (int(match_id), int(team_id))
                )

                if opponent_id is not None:
                    opponent_statistic = statistics_index.get(
                        (int(match_id), int(opponent_id))
                    )

            average_xga = cls._safe_float(
                match_xga,
                goals_against,
            )

            opponent_possession = cls._safe_float(
                cls._get_attr(opponent_statistic, "ball_possession"),
                100.0
                - cls._safe_float(
                    cls._get_attr(own_statistic, "ball_possession"),
                    cls.DEFAULT_POSSESSION,
                ),
            )

            corners_against = cls._safe_float(
                cls._get_attr(opponent_statistic, "corners"),
                cls.DEFAULT_CORNERS_AGAINST,
            )

            yellow_cards = cls._safe_float(
                cls._get_attr(own_statistic, "yellowcards"),
                cls.DEFAULT_YELLOW_CARDS,
            )

            red_cards = cls._safe_float(
                cls._get_attr(own_statistic, "redcards"),
                cls.DEFAULT_RED_CARDS,
            )

            samples.append(
                {
                    "goals_against": goals_against,
                    "clean_sheet": 1.0 if goals_against == 0 else 0.0,
                    "xga": average_xga,
                    "opponent_possession": opponent_possession,
                    "corners_against": corners_against,
                    "yellow_cards": yellow_cards,
                    "red_cards": red_cards,
                }
            )

            if len(samples) >= safe_limit:
                break

        played = len(samples)

        team_defense = cls._safe_float(
            getattr(team, "defense", None),
            cls.DEFAULT_DEFENSE_RATING,
        )

        team_xga = cls._safe_float(
            getattr(team, "xga", None),
            cls.DEFAULT_XGA,
        )

        weights = [
            max(0.35, 1.0 - index * 0.08)
            for index in range(played)
        ]

        goals_against_values = [
            sample["goals_against"] for sample in samples
        ]
        clean_sheet_values = [
            sample["clean_sheet"] for sample in samples
        ]
        xga_values = [sample["xga"] for sample in samples]
        opponent_possession_values = [
            sample["opponent_possession"] for sample in samples
        ]
        corners_against_values = [
            sample["corners_against"] for sample in samples
        ]
        yellow_card_values = [
            sample["yellow_cards"] for sample in samples
        ]
        red_card_values = [
            sample["red_cards"] for sample in samples
        ]

        average_conceded = cls._weighted_average(
            goals_against_values,
            weights,
            team_xga,
        )
        clean_sheet_rate = cls._weighted_average(
            clean_sheet_values,
            weights,
            0.25,
        )
        average_xga = cls._weighted_average(
            xga_values,
            weights,
            team_xga,
        )
        average_opponent_possession = cls._weighted_average(
            opponent_possession_values,
            weights,
            cls.DEFAULT_POSSESSION,
        )
        average_corners_against = cls._weighted_average(
            corners_against_values,
            weights,
            cls.DEFAULT_CORNERS_AGAINST,
        )
        average_yellow_cards = cls._weighted_average(
            yellow_card_values,
            weights,
            cls.DEFAULT_YELLOW_CARDS,
        )
        average_red_cards = cls._weighted_average(
            red_card_values,
            weights,
            cls.DEFAULT_RED_CARDS,
        )

        conceded_rating = cls._clamp(
            100.0 - average_conceded / 2.5 * 100.0,
            0.0,
            100.0,
        )
        xga_rating = cls._clamp(
            100.0 - average_xga / 2.5 * 100.0,
            0.0,
            100.0,
        )
        clean_sheet_rating = cls._clamp(
            clean_sheet_rate * 100.0,
            0.0,
            100.0,
        )
        possession_resistance_rating = cls._clamp(
            (65.0 - average_opponent_possession) / 30.0 * 100.0,
            0.0,
            100.0,
        )
        corners_resistance_rating = cls._clamp(
            100.0 - average_corners_against / 9.0 * 100.0,
            0.0,
            100.0,
        )
        discipline_rating = cls._clamp(
            100.0
            - average_yellow_cards * 8.0
            - average_red_cards * 35.0,
            0.0,
            100.0,
        )

        defense_rating = (
            conceded_rating * 0.32
            + xga_rating * 0.23
            + clean_sheet_rating * 0.18
            + possession_resistance_rating * 0.10
            + corners_resistance_rating * 0.08
            + discipline_rating * 0.04
            + team_defense * 0.05
        )

        sample_confidence = cls._clamp(played / 5.0, 0.0, 1.0)

        final_rating = (
            defense_rating * sample_confidence
            + team_defense * (1.0 - sample_confidence)
        )

        return {
            "version": "DefenseAnalyzer V2",
            "venue": normalized_venue or "all",
            "played": played,
            "goals_against": int(sum(goals_against_values)),
            "average_conceded": round(average_conceded, 3),
            "clean_sheets": int(sum(clean_sheet_values)),
            "clean_sheet_rate": round(clean_sheet_rate, 3),
            "xga": round(average_xga, 3),
            "average_opponent_possession": round(
                average_opponent_possession,
                2,
            ),
            "average_corners_against": round(
                average_corners_against,
                2,
            ),
            "average_yellow_cards": round(
                average_yellow_cards,
                2,
            ),
            "average_red_cards": round(
                average_red_cards,
                3,
            ),
            "sample_confidence": round(sample_confidence, 3),
            "defense_rating": round(
                cls._clamp(final_rating, 35.0, 100.0),
                2,
            ),
        }