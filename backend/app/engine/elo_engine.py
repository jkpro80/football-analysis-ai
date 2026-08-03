from dataclasses import asdict, dataclass
from math import log
from typing import Any


@dataclass(frozen=True)
class EloUpdateResult:
    """
    نتيجة تحديث تصنيف ELO بعد مباراة واحدة.
    """

    home_rating_before: int
    away_rating_before: int

    expected_home: float
    expected_away: float

    actual_home: float
    actual_away: float

    home_rating_change: int
    away_rating_change: int

    home_rating_after: int
    away_rating_after: int

    goal_difference: int
    result: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class EloEngine:
    """
    محرك ELO مخصص لمباريات كرة القدم.
    """

    def __init__(
        self,
        k_factor: float = 32.0,
        rating_divisor: float = 400.0,
        home_advantage_points: float = 80.0,
        minimum_rating: int = 500,
        maximum_rating: int = 3000,
    ) -> None:
        if k_factor <= 0:
            raise ValueError(
                "k_factor must be greater than zero."
            )

        if rating_divisor <= 0:
            raise ValueError(
                "rating_divisor must be greater than zero."
            )

        if minimum_rating >= maximum_rating:
            raise ValueError(
                "minimum_rating must be lower "
                "than maximum_rating."
            )

        self.k_factor = float(k_factor)
        self.rating_divisor = float(
            rating_divisor
        )
        self.home_advantage_points = float(
            home_advantage_points
        )
        self.minimum_rating = int(
            minimum_rating
        )
        self.maximum_rating = int(
            maximum_rating
        )

    def expected_score(
        self,
        team_rating: float,
        opponent_rating: float,
    ) -> float:
        exponent = (
            opponent_rating - team_rating
        ) / self.rating_divisor

        probability = 1.0 / (
            1.0 + 10.0**exponent
        )

        return round(
            probability,
            6,
        )

    def calculate_match_ratings(
        self,
        home_rating: int,
        away_rating: int,
        home_score: int,
        away_score: int,
        apply_home_advantage: bool = True,
    ) -> EloUpdateResult:
        self._validate_rating(
            home_rating,
            "home_rating",
        )

        self._validate_rating(
            away_rating,
            "away_rating",
        )

        self._validate_score(
            home_score,
            "home_score",
        )

        self._validate_score(
            away_score,
            "away_score",
        )

        adjusted_home_rating = float(
            home_rating
        )

        if apply_home_advantage:
            adjusted_home_rating += (
                self.home_advantage_points
            )

        expected_home = self.expected_score(
            team_rating=adjusted_home_rating,
            opponent_rating=float(
                away_rating
            ),
        )

        expected_away = round(
            1.0 - expected_home,
            6,
        )

        (
            actual_home,
            actual_away,
            result,
        ) = self._get_actual_scores(
            home_score=home_score,
            away_score=away_score,
        )

        goal_difference = abs(
            home_score - away_score
        )

        goal_multiplier = (
            self._goal_difference_multiplier(
                goal_difference
            )
        )

        effective_k = (
            self.k_factor
            * goal_multiplier
        )

        raw_home_change = (
            effective_k
            * (
                actual_home
                - expected_home
            )
        )

        home_rating_change = round(
            raw_home_change
        )

        away_rating_change = (
            -home_rating_change
        )

        home_rating_after = (
            self._clamp_rating(
                home_rating
                + home_rating_change
            )
        )

        away_rating_after = (
            self._clamp_rating(
                away_rating
                + away_rating_change
            )
        )

        home_rating_change = (
            home_rating_after
            - home_rating
        )

        away_rating_change = (
            away_rating_after
            - away_rating
        )

        return EloUpdateResult(
            home_rating_before=home_rating,
            away_rating_before=away_rating,
            expected_home=round(
                expected_home,
                4,
            ),
            expected_away=round(
                expected_away,
                4,
            ),
            actual_home=actual_home,
            actual_away=actual_away,
            home_rating_change=(
                home_rating_change
            ),
            away_rating_change=(
                away_rating_change
            ),
            home_rating_after=(
                home_rating_after
            ),
            away_rating_after=(
                away_rating_after
            ),
            goal_difference=(
                goal_difference
            ),
            result=result,
        )

    @staticmethod
    def _get_actual_scores(
        home_score: int,
        away_score: int,
    ) -> tuple[float, float, str]:
        if home_score > away_score:
            return 1.0, 0.0, "home_win"

        if home_score < away_score:
            return 0.0, 1.0, "away_win"

        return 0.5, 0.5, "draw"

    @staticmethod
    def _goal_difference_multiplier(
        goal_difference: int,
    ) -> float:
        if goal_difference <= 1:
            return 1.0

        return round(
            1.0
            + log(goal_difference) * 0.5,
            4,
        )

    def _clamp_rating(
        self,
        rating: int,
    ) -> int:
        return max(
            self.minimum_rating,
            min(
                rating,
                self.maximum_rating,
            ),
        )

    def _validate_rating(
        self,
        rating: int,
        field_name: str,
    ) -> None:
        if not isinstance(rating, int):
            raise TypeError(
                f"{field_name} must be an integer."
            )

        if (
            rating < self.minimum_rating
            or rating > self.maximum_rating
        ):
            raise ValueError(
                f"{field_name} must be between "
                f"{self.minimum_rating} and "
                f"{self.maximum_rating}."
            )

    @staticmethod
    def _validate_score(
        score: int,
        field_name: str,
    ) -> None:
        if not isinstance(score, int):
            raise TypeError(
                f"{field_name} must be an integer."
            )

        if score < 0:
            raise ValueError(
                f"{field_name} cannot be negative."
            )