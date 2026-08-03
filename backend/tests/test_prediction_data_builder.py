from typing import Any

from sqlalchemy.orm import Session

from app.engine.attack_engine import (
    AttackEngine,
    AttackStats,
)
from app.engine.defense_engine import (
    DefenseEngine,
    DefenseStats,
)
from app.engine.form_engine import (
    FormEngine,
    MatchResult,
)
from app.engine.home_advantage_engine import (
    HomeAdvantageEngine,
    HomeAdvantageStats,
)
from app.services.team_statistics_service import (
    TeamStatistics,
    TeamStatisticsService,
)


class PredictionDataBuilder:
    """
    Builds the data required by the modular prediction engines.

    When a database session is available, recent completed matches
    are used for form, goals and points calculations.

    Stored Team values remain available as fallback data.
    """

    def __init__(
        self,
        db: Session | None = None,
        form_engine: FormEngine | None = None,
        attack_engine: AttackEngine | None = None,
        defense_engine: DefenseEngine | None = None,
        home_advantage_engine: HomeAdvantageEngine | None = None,
        statistics_limit: int = 10,
    ) -> None:
        self.db = db

        self.form_engine = (
            form_engine or FormEngine()
        )
        self.attack_engine = (
            attack_engine or AttackEngine()
        )
        self.defense_engine = (
            defense_engine or DefenseEngine()
        )
        self.home_advantage_engine = (
            home_advantage_engine
            or HomeAdvantageEngine()
        )

        self.statistics_limit = max(
            1,
            min(statistics_limit, 100),
        )

        self.statistics_service = (
            TeamStatisticsService(db)
            if db is not None
            else None
        )

    def build_team_scores(
        self,
        team: Any,
    ) -> dict[str, Any]:
        """
        Build form, attack and defense scores for one team.
        """

        statistics = self.get_team_statistics(
            team
        )

        form_result = self.form_engine.calculate(
            self.build_form_results(
                team=team,
                statistics=statistics,
            )
        )

        attack_result = self.attack_engine.calculate(
            self.build_attack_stats(
                team=team,
                statistics=statistics,
            )
        )

        defense_result = self.defense_engine.calculate(
            self.build_defense_stats(
                team=team,
                statistics=statistics,
            )
        )

        return {
            "form_score": form_result[
                "form_score"
            ],
            "attack_score": attack_result[
                "attack_score"
            ],
            "defense_score": defense_result[
                "defense_score"
            ],
            "form_details": form_result,
            "attack_details": attack_result,
            "defense_details": defense_result,
            "historical_statistics": (
                self._statistics_to_dict(
                    statistics
                )
            ),
            "data_source": (
                "recent_matches"
                if statistics is not None
                else "team_fallback"
            ),
        }

    def build_match_scores(
        self,
        home_team: Any,
        away_team: Any,
    ) -> dict[str, Any]:
        """
        Build all engine scores required for one match.
        """

        home_statistics = (
            self.get_team_statistics(
                home_team
            )
        )

        away_statistics = (
            self.get_team_statistics(
                away_team
            )
        )

        home_scores = self._build_team_scores_with_statistics(
            team=home_team,
            statistics=home_statistics,
        )

        away_scores = self._build_team_scores_with_statistics(
            team=away_team,
            statistics=away_statistics,
        )

        home_advantage = (
            self.home_advantage_engine.calculate(
                self.build_home_advantage_stats(
                    home_team=home_team,
                    away_team=away_team,
                    home_statistics=home_statistics,
                    away_statistics=away_statistics,
                )
            )
        )

        return {
            "home": home_scores,
            "away": away_scores,
            "home_advantage": home_advantage,
        }

    def _build_team_scores_with_statistics(
        self,
        team: Any,
        statistics: TeamStatistics | None,
    ) -> dict[str, Any]:
        """
        Internal version that avoids querying statistics twice.
        """

        form_result = self.form_engine.calculate(
            self.build_form_results(
                team=team,
                statistics=statistics,
            )
        )

        attack_result = self.attack_engine.calculate(
            self.build_attack_stats(
                team=team,
                statistics=statistics,
            )
        )

        defense_result = self.defense_engine.calculate(
            self.build_defense_stats(
                team=team,
                statistics=statistics,
            )
        )

        return {
            "form_score": form_result[
                "form_score"
            ],
            "attack_score": attack_result[
                "attack_score"
            ],
            "defense_score": defense_result[
                "defense_score"
            ],
            "form_details": form_result,
            "attack_details": attack_result,
            "defense_details": defense_result,
            "historical_statistics": (
                self._statistics_to_dict(
                    statistics
                )
            ),
            "data_source": (
                "recent_matches"
                if statistics is not None
                else "team_fallback"
            ),
        }

    def get_team_statistics(
        self,
        team: Any,
    ) -> TeamStatistics | None:
        """
        Calculate recent-match statistics when possible.

        Returns None when:
        - no database session exists;
        - the team has no valid ID;
        - no completed historical matches exist.
        """

        if self.statistics_service is None:
            return None

        team_id = getattr(
            team,
            "id",
            None,
        )

        try:
            team_id = int(team_id)
        except (TypeError, ValueError):
            return None

        if team_id <= 0:
            return None

        statistics = (
            self.statistics_service.calculate(
                team_id=team_id,
                limit=self.statistics_limit,
            )
        )

        if statistics.matches_played <= 0:
            return None

        return statistics

    @staticmethod
    def build_attack_stats(
        team: Any,
        statistics: TeamStatistics | None = None,
    ) -> AttackStats:
        """
        Historical goals are preferred.

        Advanced values such as xG, shots and big chances currently
        remain sourced from the Team model.
        """

        if statistics is not None:
            goals_per_match = (
                statistics.goals_per_match
            )
        else:
            goals_per_match = (
                PredictionDataBuilder._number(
                    getattr(
                        team,
                        "goals_scored",
                        0.0,
                    )
                )
            )

        return AttackStats(
            goals_per_match=goals_per_match,
            xg=PredictionDataBuilder._number(
                getattr(team, "xg", 0.0)
            ),
            shots=PredictionDataBuilder._number(
                getattr(team, "shots", 0.0)
            ),
            shots_on_target=(
                PredictionDataBuilder._number(
                    getattr(
                        team,
                        "shots_on_target",
                        0.0,
                    )
                )
            ),
            big_chances=(
                PredictionDataBuilder._number(
                    getattr(
                        team,
                        "big_chances",
                        0.0,
                    )
                )
            ),
        )

    @staticmethod
    def build_defense_stats(
        team: Any,
        statistics: TeamStatistics | None = None,
    ) -> DefenseStats:
        """
        Historical goals conceded and clean-sheet rate
        are preferred when available.
        """

        if statistics is not None:
            goals_against = (
                statistics.goals_conceded_per_match
            )
            clean_sheet_rate = (
                statistics.clean_sheet_rate
            )
        else:
            goals_against = (
                PredictionDataBuilder._number(
                    getattr(
                        team,
                        "goals_conceded",
                        0.0,
                    )
                )
            )
            clean_sheet_rate = (
                PredictionDataBuilder._number(
                    getattr(
                        team,
                        "clean_sheets",
                        0.0,
                    )
                )
            )

        return DefenseStats(
            goals_against_per_match=goals_against,
            xga=PredictionDataBuilder._number(
                getattr(team, "xga", 0.0)
            ),
            clean_sheet_rate=clean_sheet_rate,
            blocks_per_match=(
                PredictionDataBuilder._number(
                    getattr(team, "blocks", 0.0)
                )
            ),
            interceptions_per_match=(
                PredictionDataBuilder._number(
                    getattr(
                        team,
                        "interceptions",
                        0.0,
                    )
                )
            ),
        )

    @staticmethod
    def build_form_results(
        team: Any,
        statistics: TeamStatistics | None = None,
    ) -> list[MatchResult]:
        """
        Convert form into MatchResult objects.

        Historical form from completed matches is preferred.
        Stored Team.form remains the fallback.
        """

        if statistics is not None:
            form = statistics.form
        else:
            form = str(
                getattr(team, "form", "") or ""
            )

        form = form.upper()

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
        home_statistics: TeamStatistics | None = None,
        away_statistics: TeamStatistics | None = None,
    ) -> HomeAdvantageStats:
        """
        Build home-advantage inputs.

        At this stage, recent overall statistics are used.
        A later version will calculate separate home-only and away-only
        statistics.
        """

        if home_statistics is not None:
            home_points = (
                home_statistics.points_per_match
            )
            home_goals = (
                home_statistics.goals_per_match
            )
            home_conceded = (
                home_statistics.goals_conceded_per_match
            )
        else:
            home_points = (
                PredictionDataBuilder._points_per_match(
                    home_team
                )
            )
            home_goals = (
                PredictionDataBuilder._number(
                    getattr(
                        home_team,
                        "goals_scored",
                        0.0,
                    )
                )
            )
            home_conceded = (
                PredictionDataBuilder._number(
                    getattr(
                        home_team,
                        "goals_conceded",
                        0.0,
                    )
                )
            )

        if away_statistics is not None:
            away_points = (
                away_statistics.points_per_match
            )
            away_goals = (
                away_statistics.goals_per_match
            )
            away_conceded = (
                away_statistics.goals_conceded_per_match
            )
        else:
            away_points = (
                PredictionDataBuilder._points_per_match(
                    away_team
                )
            )
            away_goals = (
                PredictionDataBuilder._number(
                    getattr(
                        away_team,
                        "goals_scored",
                        0.0,
                    )
                )
            )
            away_conceded = (
                PredictionDataBuilder._number(
                    getattr(
                        away_team,
                        "goals_conceded",
                        0.0,
                    )
                )
            )

        return HomeAdvantageStats(
            home_points_per_match=home_points,
            home_goals_per_match=home_goals,
            home_goals_against_per_match=(
                home_conceded
            ),
            away_points_per_match=away_points,
            away_goals_per_match=away_goals,
            away_goals_against_per_match=(
                away_conceded
            ),
        )

    @staticmethod
    def _points_per_match(
        team: Any,
    ) -> float:
        wins = PredictionDataBuilder._number(
            getattr(team, "wins", 0)
        )
        draws = PredictionDataBuilder._number(
            getattr(team, "draws", 0)
        )
        losses = PredictionDataBuilder._number(
            getattr(team, "losses", 0)
        )

        matches_played = (
            wins + draws + losses
        )

        if matches_played <= 0:
            return 0.0

        points = wins * 3.0 + draws

        return round(
            points / matches_played,
            3,
        )

    @staticmethod
    def _statistics_to_dict(
        statistics: TeamStatistics | None,
    ) -> dict[str, Any] | None:
        if statistics is None:
            return None

        return {
            "team_id": statistics.team_id,
            "matches_played": (
                statistics.matches_played
            ),
            "wins": statistics.wins,
            "draws": statistics.draws,
            "losses": statistics.losses,
            "goals_scored": (
                statistics.goals_scored
            ),
            "goals_conceded": (
                statistics.goals_conceded
            ),
            "goals_per_match": (
                statistics.goals_per_match
            ),
            "goals_conceded_per_match": (
                statistics.goals_conceded_per_match
            ),
            "points_per_match": (
                statistics.points_per_match
            ),
            "clean_sheet_rate": (
                statistics.clean_sheet_rate
            ),
            "btts_rate": statistics.btts_rate,
            "over_2_5_rate": (
                statistics.over_2_5_rate
            ),
            "form": statistics.form,
        }

    @staticmethod
    def _number(
        value: Any,
    ) -> float:
        if value is None:
            return 0.0

        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0