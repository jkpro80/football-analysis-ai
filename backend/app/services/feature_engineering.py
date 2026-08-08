from app.services.form_analyzer import FormAnalyzer
from app.services.attack_analyzer import AttackAnalyzer
from app.services.defense_analyzer import DefenseAnalyzer


class FeatureEngineering:

    @staticmethod
    def _number(value, default=0.0):
        try:
            if value is None:
                return float(default)

            return float(value)

        except (TypeError, ValueError):
            return float(default)

    @classmethod
    def _shot_accuracy(cls, attack_data):
        explicit_accuracy = attack_data.get("shot_accuracy")

        if explicit_accuracy is not None:
            return round(
                cls._number(explicit_accuracy),
                2,
            )

        shots = cls._number(
            attack_data.get("shots")
        )

        shots_on_target = cls._number(
            attack_data.get("shots_on_target")
        )

        if shots <= 0:
            return 0.0

        return round(
            min(
                max(
                    (shots_on_target / shots) * 100,
                    0.0,
                ),
                100.0,
            ),
            2,
        )

    def build(self, match_data):

        home = match_data["home_team"]
        away = match_data["away_team"]

        # =====================================
        # Form Analyzer
        # =====================================

        home_form = FormAnalyzer.analyze(
            match_data["recent_home"],
            home.id,
        )

        away_form = FormAnalyzer.analyze(
            match_data["recent_away"],
            away.id,
        )

        # =====================================
        # Attack Analyzer
        # =====================================

        home_attack = AttackAnalyzer.analyze(
            match_data["recent_home"],
            home.id,
            home,
            "home",
        )

        away_attack = AttackAnalyzer.analyze(
            match_data["recent_away"],
            away.id,
            away,
            "away",
        )

        home_shots = self._number(
            home_attack.get("shots"),
            getattr(home, "shots", None) or 12.0,
        )

        away_shots = self._number(
            away_attack.get("shots"),
            getattr(away, "shots", None) or 12.0,
        )

        home_shots_on_target = self._number(
            home_attack.get("shots_on_target"),
            getattr(home, "shots_on_target", None) or 5.0,
        )

        away_shots_on_target = self._number(
            away_attack.get("shots_on_target"),
            getattr(away, "shots_on_target", None) or 5.0,
        )

        home_shot_accuracy = self._shot_accuracy(
            {
                **home_attack,
                "shots": home_shots,
                "shots_on_target": home_shots_on_target,
            }
        )

        away_shot_accuracy = self._shot_accuracy(
            {
                **away_attack,
                "shots": away_shots,
                "shots_on_target": away_shots_on_target,
            }
        )

        # =====================================
        # Defense Analyzer
        # =====================================

        home_defense_analysis = DefenseAnalyzer.analyze(
            match_data["recent_home"],
            home.id,
            home,
            "home",
        )

        away_defense_analysis = DefenseAnalyzer.analyze(
            match_data["recent_away"],
            away.id,
            away,
            "away",
        )

        return {

            # =====================================
            # Basic Ratings
            # =====================================

            "home_attack": self._number(
                home.attack,
                80.0,
            ),
            "away_attack": self._number(
                away.attack,
                80.0,
            ),

            "home_defense": self._number(
                home.defense,
                80.0,
            ),
            "away_defense": self._number(
                away.defense,
                80.0,
            ),

            "home_elo": self._number(
                home.elo,
                1500.0,
            ),
            "away_elo": self._number(
                away.elo,
                1500.0,
            ),

            "home_advantage": self._number(
                home.home_advantage,
                1.1,
            ),

            # =====================================
            # xG
            # =====================================

            "home_xg": self._number(
                home.xg,
                1.5,
            ),
            "away_xg": self._number(
                away.xg,
                1.5,
            ),

            "home_xga": self._number(
                home.xga,
                1.0,
            ),
            "away_xga": self._number(
                away.xga,
                1.0,
            ),

            # =====================================
            # Goals
            # =====================================

            "home_goals_scored": self._number(
                home.goals_scored,
                1.5,
            ),
            "away_goals_scored": self._number(
                away.goals_scored,
                1.5,
            ),

            "home_goals_conceded": self._number(
                home.goals_conceded,
                1.2,
            ),
            "away_goals_conceded": self._number(
                away.goals_conceded,
                1.2,
            ),

            # =====================================
            # Possession
            # =====================================

            "home_possession": self._number(
                home.possession,
                50.0,
            ),
            "away_possession": self._number(
                away.possession,
                50.0,
            ),

            # =====================================
            # Corners
            # =====================================

            "home_corners": self._number(
                home.corners,
                5.0,
            ),
            "away_corners": self._number(
                away.corners,
                5.0,
            ),

            # =====================================
            # Cards
            # =====================================

            "home_yellow_cards": self._number(
                home.yellow_cards,
                2.0,
            ),
            "away_yellow_cards": self._number(
                away.yellow_cards,
                2.0,
            ),

            # =====================================
            # Fouls
            # =====================================

            "home_fouls": self._number(
                getattr(home, "fouls", None),
                11.0,
            ),
            "away_fouls": self._number(
                getattr(away, "fouls", None),
                11.0,
            ),

            # =====================================
            # Defensive Stats
            # =====================================

            "home_clean_sheets": self._number(
                home.clean_sheets,
                30.0,
            ),
            "away_clean_sheets": self._number(
                away.clean_sheets,
                30.0,
            ),

            "home_failed_to_score": self._number(
                home.failed_to_score,
                20.0,
            ),
            "away_failed_to_score": self._number(
                away.failed_to_score,
                20.0,
            ),

            # =====================================
            # Recent Form
            # =====================================

            "home_form_points": self._number(
                home_form.get("points")
            ),
            "away_form_points": self._number(
                away_form.get("points")
            ),

            "home_form_wins": self._number(
                home_form.get("wins")
            ),
            "away_form_wins": self._number(
                away_form.get("wins")
            ),

            "home_form_draws": self._number(
                home_form.get("draws")
            ),
            "away_form_draws": self._number(
                away_form.get("draws")
            ),

            "home_form_losses": self._number(
                home_form.get("losses")
            ),
            "away_form_losses": self._number(
                away_form.get("losses")
            ),

            "home_avg_goals": self._number(
                home_form.get("average_goals_for"),
                1.5,
            ),
            "away_avg_goals": self._number(
                away_form.get("average_goals_for"),
                1.5,
            ),

            "home_avg_conceded": self._number(
                home_form.get("average_goals_against"),
                1.2,
            ),
            "away_avg_conceded": self._number(
                away_form.get("average_goals_against"),
                1.2,
            ),

            # =====================================
            # Attack Analyzer
            # =====================================

            "home_attack_rating": self._number(
                home_attack.get("attack_rating"),
                50.0,
            ),
            "away_attack_rating": self._number(
                away_attack.get("attack_rating"),
                50.0,
            ),

            "home_recent_avg_goals": self._number(
                home_attack.get("average_goals"),
                1.5,
            ),
            "away_recent_avg_goals": self._number(
                away_attack.get("average_goals"),
                1.5,
            ),

            "home_attack_played": self._number(
                home_attack.get("played")
            ),
            "away_attack_played": self._number(
                away_attack.get("played")
            ),

            "home_attack_goals": self._number(
                home_attack.get("goals_for")
            ),
            "away_attack_goals": self._number(
                away_attack.get("goals_for")
            ),

            "home_attack_xg": self._number(
                home_attack.get("xg"),
                getattr(home, "xg", None) or 1.5,
            ),
            "away_attack_xg": self._number(
                away_attack.get("xg"),
                getattr(away, "xg", None) or 1.5,
            ),

            "home_shots": home_shots,
            "away_shots": away_shots,

            "home_shots_on_target": home_shots_on_target,
            "away_shots_on_target": away_shots_on_target,

            "home_shot_accuracy": home_shot_accuracy,
            "away_shot_accuracy": away_shot_accuracy,

            # =====================================
            # Defense Analyzer
            # =====================================

            "home_defense_rating": self._number(
                home_defense_analysis.get(
                    "defense_rating"
                ),
                50.0,
            ),
            "away_defense_rating": self._number(
                away_defense_analysis.get(
                    "defense_rating"
                ),
                50.0,
            ),

            "home_recent_conceded": self._number(
                home_defense_analysis.get(
                    "average_conceded"
                ),
                1.2,
            ),
            "away_recent_conceded": self._number(
                away_defense_analysis.get(
                    "average_conceded"
                ),
                1.2,
            ),

            "home_clean_sheet_rate": self._number(
                home_defense_analysis.get(
                    "clean_sheet_rate"
                )
            ),
            "away_clean_sheet_rate": self._number(
                away_defense_analysis.get(
                    "clean_sheet_rate"
                )
            ),

            "home_recent_xga": self._number(
                home_defense_analysis.get("xga"),
                getattr(home, "xga", None) or 1.0,
            ),
            "away_recent_xga": self._number(
                away_defense_analysis.get("xga"),
                getattr(away, "xga", None) or 1.0,
            ),

            "home_defense_played": self._number(
                home_defense_analysis.get("played")
            ),
            "away_defense_played": self._number(
                away_defense_analysis.get("played")
            ),

            "home_defense_goals_against": self._number(
                home_defense_analysis.get(
                    "goals_against"
                )
            ),
            "away_defense_goals_against": self._number(
                away_defense_analysis.get(
                    "goals_against"
                )
            ),

            "home_defense_clean_sheets": self._number(
                home_defense_analysis.get(
                    "clean_sheets"
                )
            ),
            "away_defense_clean_sheets": self._number(
                away_defense_analysis.get(
                    "clean_sheets"
                )
            ),
        }