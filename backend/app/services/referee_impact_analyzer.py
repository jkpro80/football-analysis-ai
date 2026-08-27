from __future__ import annotations

from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.models import Match, MatchStatistic


class RefereeImpactAnalyzer:
    """
    Builds a historical referee profile for Prediction Engine V11.

    The analyzer is intentionally defensive:
    - referee context is optional;
    - small samples are shrunk toward the global baseline;
    - missing referee data never blocks a prediction;
    - red cards are excluded from the primary factor until data
      completeness is sufficient.
    """

    MIN_SAMPLE_SIZE = 3
    FULL_CONFIDENCE_SAMPLE_SIZE = 20

    MIN_CARD_FACTOR = 0.90
    MAX_CARD_FACTOR = 1.10

    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")
        self.db = db

    def analyze(
        self,
        *,
        fixture_id: int,
    ) -> dict[str, Any]:
        match = (
            self.db.query(Match)
            .filter(Match.id == fixture_id)
            .first()
        )

        if match is None:
            return self._unavailable(
                warning="Match not found for referee analysis."
            )

        referee_name = self._normalize_name(
            getattr(match, "referee_name", None)
        )

        if referee_name is None:
            return self._unavailable(
                warning="Referee is not available for this fixture."
            )

        referee_rows = self._referee_match_totals(
            referee_name=referee_name,
            exclude_fixture_id=fixture_id,
        )

        sample_size = len(referee_rows)

        if sample_size < self.MIN_SAMPLE_SIZE:
            return self._unavailable(
                referee_name=referee_name,
                sample_size=sample_size,
                warning=(
                    "Insufficient historical referee sample."
                ),
            )

        global_rows = self._global_match_totals(
            exclude_fixture_id=fixture_id,
        )

        referee_yellow_values = [
            row["yellow_cards"]
            for row in referee_rows
            if row["yellow_cards"] is not None
        ]

        referee_foul_values = [
            row["fouls"]
            for row in referee_rows
            if row["fouls"] is not None
        ]

        global_yellow_values = [
            row["yellow_cards"]
            for row in global_rows
            if row["yellow_cards"] is not None
        ]

        global_foul_values = [
            row["fouls"]
            for row in global_rows
            if row["fouls"] is not None
        ]

        referee_yellow_average = self._average(
            referee_yellow_values
        )
        referee_foul_average = self._average(
            referee_foul_values
        )
        global_yellow_average = self._average(
            global_yellow_values
        )
        global_foul_average = self._average(
            global_foul_values
        )

        if (
            referee_yellow_average is None
            or global_yellow_average is None
            or global_yellow_average <= 0.0
        ):
            return self._unavailable(
                referee_name=referee_name,
                sample_size=sample_size,
                warning=(
                    "Yellow-card history is insufficient "
                    "for referee adjustment."
                ),
            )

        raw_card_ratio = (
            referee_yellow_average
            / global_yellow_average
        )

        sample_confidence = self._sample_confidence(
            sample_size
        )

        adjusted_factor = (
            1.0
            + (raw_card_ratio - 1.0)
            * sample_confidence
        )

        adjusted_factor = self._clamp(
            adjusted_factor,
            self.MIN_CARD_FACTOR,
            self.MAX_CARD_FACTOR,
        )

        strictness = self._strictness(
            adjusted_factor
        )

        confidence_level = self._confidence_level(
            sample_size
        )

        features = {
            "referee_profile_available": True,
            "referee_name": referee_name,
            "referee_matches_analyzed": sample_size,
            "referee_yellow_cards_per_match": round(
                referee_yellow_average,
                3,
            ),
            "referee_fouls_per_match": (
                round(referee_foul_average, 3)
                if referee_foul_average is not None
                else None
            ),
            "referee_global_yellow_cards_per_match": round(
                global_yellow_average,
                3,
            ),
            "referee_global_fouls_per_match": (
                round(global_foul_average, 3)
                if global_foul_average is not None
                else None
            ),
            "referee_card_factor": round(
                adjusted_factor,
                4,
            ),
            "referee_sample_confidence": round(
                sample_confidence,
                4,
            ),
            "referee_confidence_level": confidence_level,
            "referee_strictness": strictness,
        }

        return {
            "available": True,
            "referee_name": referee_name,
            "sample_size": sample_size,
            "features": features,
            "profile": {
                "matches_analyzed": sample_size,
                "yellow_cards_per_match": round(
                    referee_yellow_average,
                    2,
                ),
                "fouls_per_match": (
                    round(referee_foul_average, 2)
                    if referee_foul_average is not None
                    else None
                ),
                "global_yellow_cards_per_match": round(
                    global_yellow_average,
                    2,
                ),
                "global_fouls_per_match": (
                    round(global_foul_average, 2)
                    if global_foul_average is not None
                    else None
                ),
                "card_factor": round(
                    adjusted_factor,
                    4,
                ),
                "sample_confidence": round(
                    sample_confidence,
                    4,
                ),
                "confidence_level": confidence_level,
                "strictness": strictness,
            },
            "warnings": [],
        }

    def _referee_match_totals(
        self,
        *,
        referee_name: str,
        exclude_fixture_id: int,
    ) -> list[dict[str, float | None]]:
        rows = (
            self.db.query(
                Match.id.label("fixture_id"),
                func.sum(
                    MatchStatistic.yellow_cards
                ).label("yellow_cards"),
                func.sum(
                    MatchStatistic.fouls
                ).label("fouls"),
            )
            .join(
                MatchStatistic,
                MatchStatistic.fixture_id == Match.id,
            )
            .filter(
                Match.referee_name == referee_name,
                Match.id != exclude_fixture_id,
            )
            .group_by(Match.id)
            .all()
        )

        return [
            {
                "yellow_cards": self._optional_float(
                    row.yellow_cards
                ),
                "fouls": self._optional_float(
                    row.fouls
                ),
            }
            for row in rows
        ]

    def _global_match_totals(
        self,
        *,
        exclude_fixture_id: int,
    ) -> list[dict[str, float | None]]:
        rows = (
            self.db.query(
                MatchStatistic.fixture_id.label(
                    "fixture_id"
                ),
                func.sum(
                    MatchStatistic.yellow_cards
                ).label("yellow_cards"),
                func.sum(
                    MatchStatistic.fouls
                ).label("fouls"),
            )
            .filter(
                MatchStatistic.fixture_id
                != exclude_fixture_id
            )
            .group_by(
                MatchStatistic.fixture_id
            )
            .all()
        )

        return [
            {
                "yellow_cards": self._optional_float(
                    row.yellow_cards
                ),
                "fouls": self._optional_float(
                    row.fouls
                ),
            }
            for row in rows
        ]

    @classmethod
    def _sample_confidence(
        cls,
        sample_size: int,
    ) -> float:
        if sample_size <= 0:
            return 0.0

        return cls._clamp(
            sample_size
            / cls.FULL_CONFIDENCE_SAMPLE_SIZE,
            0.0,
            1.0,
        )

    @staticmethod
    def _confidence_level(
        sample_size: int,
    ) -> str:
        if sample_size >= 20:
            return "high"
        if sample_size >= 10:
            return "medium"
        return "low"

    @staticmethod
    def _strictness(
        factor: float,
    ) -> str:
        if factor >= 1.06:
            return "strict"
        if factor >= 1.02:
            return "above_average"
        if factor <= 0.94:
            return "lenient"
        if factor <= 0.98:
            return "below_average"
        return "average"

    @staticmethod
    def _average(
        values: list[float],
    ) -> float | None:
        if not values:
            return None
        return sum(values) / len(values)

    @staticmethod
    def _normalize_name(
        value: Any,
    ) -> str | None:
        if not isinstance(value, str):
            return None

        normalized = " ".join(
            value.strip().split()
        )

        return normalized or None

    @staticmethod
    def _optional_float(
        value: Any,
    ) -> float | None:
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        return max(
            minimum,
            min(maximum, value),
        )

    @staticmethod
    def _unavailable(
        *,
        referee_name: str | None = None,
        sample_size: int = 0,
        warning: str,
    ) -> dict[str, Any]:
        return {
            "available": False,
            "referee_name": referee_name,
            "sample_size": sample_size,
            "features": {
                "referee_profile_available": False,
                "referee_name": referee_name,
                "referee_matches_analyzed": sample_size,
                "referee_card_factor": 1.0,
                "referee_sample_confidence": 0.0,
                "referee_confidence_level": "unavailable",
                "referee_strictness": "unknown",
            },
            "profile": None,
            "warnings": [warning],
        }
