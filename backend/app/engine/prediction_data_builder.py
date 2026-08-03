from typing import Any

from app.engine.attack_engine import AttackEngine, AttackStats
from app.engine.defense_engine import DefenseEngine, DefenseStats
from app.engine.form_engine import FormEngine, MatchResult
from app.engine.home_advantage_engine import (
    HomeAdvantageEngine,
    HomeAdvantageStats,
)


class PredictionDataBuilder:
    """
    Converts stored Team model data into inputs required by
    the modular prediction engines.

    The current version uses Team table statistics as a fallback.
    Historical match calculations will be added later.
    """

    def __init__(
        self,
        form_engine: FormEngine | None = None,
        attack_engine: AttackEngine | None = None,
        defense_engine: DefenseEngine | None = None,
        home_advantage_engine: HomeAdvantageEngine | None = None,
    ) -> None:
        self.form_engine = form_engine or FormEngine()
        self.attack_engine = attack_engine or AttackEngine()
        self.defense_engine = defense_engine or DefenseEngine()
        self.home_advantage_engine = (
            home_advantage_engine or HomeAdvantageEngine()
        )

    def build_team_scores(self, team: Any) -> dict:
        """
        Builds form, attack and defense scores for one team.
        """

        form_result = self.form_engine.calculate(
            self.build_form_results(team)
        )

        attack_result = self.attack_engine.calculate(
            self.build_attack_stats(team)
        )

        defense_result = self.defense_engine.calculate(
            self.build_defense_stats(team)
        )

        return {
            "form_score": form_result["form_score"],
            "attack_score": attack_result["attack_score"],
            "defense_score": defense_result["defense_score"],
            "form_details": form_result,
            "attack_details": attack_result,
            "defense_details": defense_result,
        }

    def build_match_scores(
        self,
        home_team: Any,
        away_team: Any,
    ) -> dict:
        """
        Builds all modular-engine scores for a match.
        """

        home_scores = self.build_team_scores(home_team)
        away_scores = self.build_team_scores(away_team)

        home_advantage = self.home_advantage_engine.calculate(
            self.build_home_advantage_stats(
                home_team=home_team,
                away_team=away_team,
            )
        )

        return {
            "home": home_scores,
            "away": away_scores,
            "home_advantage": home_advantage,
        }

    @staticmethod
    def build_attack_stats(team: Any) -> AttackStats:
        return AttackStats(
            goals_per_match=PredictionDataBuilder._number(
                getattr(team, "goals_scored", 0.0)
            ),
            xg=PredictionDataBuilder._number(
                getattr(team, "xg", 0.0)
            ),
            shots=PredictionDataBuilder._number(
                getattr(team, "shots", 0.0)
            ),
            shots_on_target=PredictionDataBuilder._number(
                getattr(team, "shots_on_target", 0.0)
            ),
            big_chances=PredictionDataBuilder._number(
                getattr(team, "big_chances", 0.0)
            ),
        )

    @staticmethod
    def build_defense_stats(team: Any) -> DefenseStats:
        return DefenseStats(
            goals_against_per_match=PredictionDataBuilder._number(
                getattr(team, "goals_conceded", 0.0)
            ),
            xga=PredictionDataBuilder._number(
                getattr(team, "xga", 0.0)
            ),
            clean_sheet_rate=PredictionDataBuilder._number(
                getattr(team, "clean_sheets", 0.0)
            ),
            blocks_per_match=PredictionDataBuilder._number(
                getattr(team, "blocks", 0.0)
            ),
            interceptions_per_match=PredictionDataBuilder._number(
                getattr(team, "interceptions", 0.0)
            ),
        )

    @staticmethod
    def build_form_results(team: Any) -> list[MatchResult]:
        """
        Converts a form string such as WWDLW into MatchResult objects.

        These synthetic scores preserve the result:
        W = 1-0
        D = 0-0
        L = 0-1
        """

        form = str(
            getattr(team, "form", "") or ""
        ).upper()

        results: list[MatchResult] = []

        for result in form:
            if result == "W":
                results.append(
                    MatchResult(
                        goals_for=1,
                        goals_against=0,
                    )
                )
            elif result == "D":
                results.append(
                    MatchResult(
                        goals_for=0,
                        goals_against=0,
                    )
                )
            elif result == "L":
                results.append(
                    MatchResult(
                        goals_for=0,
                        goals_against=1,
                    )
                )

        if not results:
            results.append(
                MatchResult(
                    goals_for=0,
                    goals_against=0,
                )
            )

        return results

    @staticmethod
    def build_home_advantage_stats(
        home_team: Any,
        away_team: Any,
    ) -> HomeAdvantageStats:
        return HomeAdvantageStats(
            home_points_per_match=(
                PredictionDataBuilder._points_per_match(home_team)
            ),
            home_goals_per_match=PredictionDataBuilder._number(
                getattr(home_team, "goals_scored", 0.0)
            ),
            home_goals_against_per_match=(
                PredictionDataBuilder._number(
                    getattr(home_team, "goals_conceded", 0.0)
                )
            ),
            away_points_per_match=(
                PredictionDataBuilder._points_per_match(away_team)
            ),
            away_goals_per_match=PredictionDataBuilder._number(
                getattr(away_team, "goals_scored", 0.0)
            ),
            away_goals_against_per_match=(
                PredictionDataBuilder._number(
                    getattr(away_team, "goals_conceded", 0.0)
                )
            ),
        )

    @staticmethod
    def _points_per_match(team: Any) -> float:
        wins = PredictionDataBuilder._number(
            getattr(team, "wins", 0)
        )
        draws = PredictionDataBuilder._number(
            getattr(team, "draws", 0)
        )
        losses = PredictionDataBuilder._number(
            getattr(team, "losses", 0)
        )

        matches_played = wins + draws + losses

        if matches_played <= 0:
            return 0.0

        points = wins * 3.0 + draws

        return round(points / matches_played, 3)

    @staticmethod
    def _number(value: Any) -> float:
        if value is None:
            return 0.0

        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0