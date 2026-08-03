from typing import Any


class EloRatingEngine:
    """
    محرك ELO لتقييم قوة فرق كرة القدم.

    يقوم بحساب:
    - احتمال فوز كل فريق.
    - التقييم الجديد بعد المباراة.
    - تأثير أفضلية الأرض.
    - تأثير فارق الأهداف.
    """

    DEFAULT_RATING = 1500.0
    DEFAULT_K_FACTOR = 32.0
    DEFAULT_HOME_ADVANTAGE = 80.0

    def __init__(
        self,
        k_factor: float = DEFAULT_K_FACTOR,
        home_advantage: float = DEFAULT_HOME_ADVANTAGE,
    ) -> None:
        if k_factor <= 0:
            raise ValueError(
                "k_factor must be greater than zero"
            )

        if home_advantage < 0:
            raise ValueError(
                "home_advantage cannot be negative"
            )

        self.k_factor = float(k_factor)
        self.home_advantage = float(
            home_advantage
        )

    @staticmethod
    def _safe_float(
        value: Any,
        default: float,
    ) -> float:
        """
        تحويل القيمة إلى float بصورة آمنة.
        """

        try:
            return float(value)

        except (TypeError, ValueError):
            return default

    def expected_score(
        self,
        team_rating: float,
        opponent_rating: float,
    ) -> float:
        """
        حساب النتيجة المتوقعة وفق معادلة ELO.

        القيمة تكون بين 0 و1.
        """

        rating_difference = (
            opponent_rating - team_rating
        )

        expected = 1.0 / (
            1.0
            + 10.0
            ** (
                rating_difference / 400.0
            )
        )

        return round(
            expected,
            6,
        )

    def match_probabilities(
        self,
        home_rating: float,
        away_rating: float,
    ) -> dict[str, float]:
        """
        حساب احتمالات القوة الأولية للفريقين.

        تتم إضافة أفضلية الأرض إلى تقييم
        الفريق صاحب الأرض.
        """

        home_rating = self._safe_float(
            home_rating,
            self.DEFAULT_RATING,
        )

        away_rating = self._safe_float(
            away_rating,
            self.DEFAULT_RATING,
        )

        adjusted_home_rating = (
            home_rating
            + self.home_advantage
        )

        home_probability = self.expected_score(
            adjusted_home_rating,
            away_rating,
        )

        away_probability = self.expected_score(
            away_rating,
            adjusted_home_rating,
        )

        return {
            "home": round(
                home_probability * 100.0,
                2,
            ),
            "away": round(
                away_probability * 100.0,
                2,
            ),
            "adjusted_home_rating": round(
                adjusted_home_rating,
                2,
            ),
            "home_rating": round(
                home_rating,
                2,
            ),
            "away_rating": round(
                away_rating,
                2,
            ),
        }

    @staticmethod
    def result_scores(
        home_goals: int,
        away_goals: int,
    ) -> tuple[float, float]:
        """
        تحويل نتيجة المباراة إلى قيم ELO.

        فوز = 1
        تعادل = 0.5
        خسارة = 0
        """

        if home_goals > away_goals:
            return 1.0, 0.0

        if home_goals < away_goals:
            return 0.0, 1.0

        return 0.5, 0.5

    @staticmethod
    def goal_difference_multiplier(
        home_goals: int,
        away_goals: int,
    ) -> float:
        """
        زيادة تأثير المباراة عندما يكون
        فارق الأهداف كبيرًا.
        """

        goal_difference = abs(
            home_goals - away_goals
        )

        if goal_difference <= 1:
            return 1.0

        if goal_difference == 2:
            return 1.5

        if goal_difference == 3:
            return 1.75

        return 1.75 + (
            goal_difference - 3
        ) * 0.125

    def update_ratings(
        self,
        home_rating: float,
        away_rating: float,
        home_goals: int,
        away_goals: int,
    ) -> dict[str, Any]:
        """
        تحديث تقييم الفريقين بعد انتهاء المباراة.
        """

        home_rating = self._safe_float(
            home_rating,
            self.DEFAULT_RATING,
        )

        away_rating = self._safe_float(
            away_rating,
            self.DEFAULT_RATING,
        )

        home_goals = int(home_goals)
        away_goals = int(away_goals)

        adjusted_home_rating = (
            home_rating
            + self.home_advantage
        )

        expected_home = self.expected_score(
            adjusted_home_rating,
            away_rating,
        )

        expected_away = self.expected_score(
            away_rating,
            adjusted_home_rating,
        )

        actual_home, actual_away = (
            self.result_scores(
                home_goals,
                away_goals,
            )
        )

        goal_multiplier = (
            self.goal_difference_multiplier(
                home_goals,
                away_goals,
            )
        )

        effective_k = (
            self.k_factor
            * goal_multiplier
        )

        home_change = effective_k * (
            actual_home - expected_home
        )

        away_change = effective_k * (
            actual_away - expected_away
        )

        new_home_rating = (
            home_rating
            + home_change
        )

        new_away_rating = (
            away_rating
            + away_change
        )

        return {
            "before": {
                "home": round(
                    home_rating,
                    2,
                ),
                "away": round(
                    away_rating,
                    2,
                ),
            },
            "after": {
                "home": round(
                    new_home_rating,
                    2,
                ),
                "away": round(
                    new_away_rating,
                    2,
                ),
            },
            "change": {
                "home": round(
                    home_change,
                    2,
                ),
                "away": round(
                    away_change,
                    2,
                ),
            },
            "expected": {
                "home": round(
                    expected_home * 100.0,
                    2,
                ),
                "away": round(
                    expected_away * 100.0,
                    2,
                ),
            },
            "actual": {
                "home": actual_home,
                "away": actual_away,
            },
            "score": {
                "home": home_goals,
                "away": away_goals,
            },
            "goal_difference_multiplier": round(
                goal_multiplier,
                3,
            ),
            "effective_k_factor": round(
                effective_k,
                3,
            ),
        }

    def compare_teams(
        self,
        home_rating: float,
        away_rating: float,
    ) -> dict[str, Any]:
        """
        مقارنة قوة فريقين قبل المباراة.
        """

        probabilities = (
            self.match_probabilities(
                home_rating,
                away_rating,
            )
        )

        home_probability = probabilities[
            "home"
        ]

        away_probability = probabilities[
            "away"
        ]

        difference = round(
            home_probability
            - away_probability,
            2,
        )

        if difference >= 15:
            stronger_team = "home"
            strength_level = "clear"

        elif difference >= 5:
            stronger_team = "home"
            strength_level = "slight"

        elif difference <= -15:
            stronger_team = "away"
            strength_level = "clear"

        elif difference <= -5:
            stronger_team = "away"
            strength_level = "slight"

        else:
            stronger_team = "balanced"
            strength_level = "balanced"

        return {
            **probabilities,
            "probability_difference": (
                difference
            ),
            "stronger_team": stronger_team,
            "strength_level": strength_level,
            "model": "ELO Rating Engine V1",
        }