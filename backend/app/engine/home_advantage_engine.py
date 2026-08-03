from dataclasses import dataclass


@dataclass
class HomeAdvantageStats:
    home_points_per_match: float
    home_goals_per_match: float
    home_goals_against_per_match: float
    away_points_per_match: float
    away_goals_per_match: float
    away_goals_against_per_match: float


class HomeAdvantageEngine:
    """
    Calculates the home advantage score from 0 to 100.

    A score above 50 favors the home team.
    A score below 50 means the away team performs well away from home.
    """

    def calculate(self, stats: HomeAdvantageStats) -> dict:
        home_points_score = self._normalize(
            stats.home_points_per_match,
            maximum=3.0,
        )

        away_points_score = self._normalize(
            stats.away_points_per_match,
            maximum=3.0,
        )

        home_attack_score = self._normalize(
            stats.home_goals_per_match,
            maximum=3.5,
        )

        away_attack_score = self._normalize(
            stats.away_goals_per_match,
            maximum=3.5,
        )

        home_defense_score = 100.0 - self._normalize(
            stats.home_goals_against_per_match,
            maximum=3.0,
        )

        away_defense_score = 100.0 - self._normalize(
            stats.away_goals_against_per_match,
            maximum=3.0,
        )

        home_strength = (
            home_points_score * 0.50
            + home_attack_score * 0.25
            + home_defense_score * 0.25
        )

        away_strength = (
            away_points_score * 0.50
            + away_attack_score * 0.25
            + away_defense_score * 0.25
        )

        strength_difference = home_strength - away_strength

        home_advantage_score = 50.0 + (strength_difference * 0.35)

        home_advantage_score = min(
            max(home_advantage_score, 0.0),
            100.0,
        )

        return {
            "home_advantage_score": round(home_advantage_score, 2),
            "home_strength": round(home_strength, 2),
            "away_strength": round(away_strength, 2),
            "strength_difference": round(strength_difference, 2),
        }

    @staticmethod
    def _normalize(value: float, maximum: float) -> float:
        if maximum <= 0:
            raise ValueError("maximum must be greater than zero")

        normalized = max(value, 0.0) / maximum * 100.0

        return min(normalized, 100.0)