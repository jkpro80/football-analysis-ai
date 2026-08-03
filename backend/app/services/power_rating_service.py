from __future__ import annotations

from typing import Any

from app.database.models import Team


class PowerRatingService:
    """
    حساب تقييم مركب لقوة الفريق من 0 إلى 100.

    هذه الخدمة مستقلة عن Prediction V4.1،
    ولا تعدّل قاعدة البيانات أو محرك V4.

    المرحلة الأولى تعتمد على البيانات
    الموجودة حاليًا في جدول teams.
    """

    VERSION = "Power Rating V5.0 Baseline"

    def calculate_team_rating(
        self,
        team: Team,
    ) -> dict[str, Any]:
        """
        حساب Power Rating لفريق واحد
        مع إرجاع تفاصيل المكونات.
        """

        elo_score = self._normalize_elo(
            self._number(
                team.elo,
                1800,
            )
        )

        squad_score = self._calculate_squad_score(
            attack=self._number(
                team.attack,
                80,
            ),
            midfield=self._number(
                team.midfield,
                80,
            ),
            defense=self._number(
                team.defense,
                80,
            ),
        )

        attacking_score = (
            self._calculate_attacking_score(
                xg=self._number(
                    team.xg,
                    1.50,
                ),
                goals_scored=self._number(
                    team.goals_scored,
                    1.50,
                ),
                shots=self._number(
                    team.shots,
                    12.0,
                ),
                shots_on_target=self._number(
                    team.shots_on_target,
                    5.0,
                ),
            )
        )

        defensive_score = (
            self._calculate_defensive_score(
                xga=self._number(
                    team.xga,
                    1.00,
                ),
                goals_conceded=self._number(
                    team.goals_conceded,
                    1.00,
                ),
                clean_sheets=self._number(
                    team.clean_sheets,
                    30.0,
                ),
            )
        )

        form_score = self._calculate_form_score(
            team.form or "",
        )

        reliability_score = (
            self._calculate_reliability_score(
                failed_to_score=self._number(
                    team.failed_to_score,
                    20.0,
                ),
                wins=self._number(
                    team.wins,
                    0,
                ),
                draws=self._number(
                    team.draws,
                    0,
                ),
                losses=self._number(
                    team.losses,
                    0,
                ),
            )
        )

        discipline_score = (
            self._calculate_discipline_score(
                yellow_cards=self._number(
                    team.yellow_cards,
                    2.0,
                ),
                red_cards=self._number(
                    team.red_cards,
                    0.1,
                ),
            )
        )

        components = {
            "elo": round(
                elo_score,
                2,
            ),
            "squad": round(
                squad_score,
                2,
            ),
            "attacking": round(
                attacking_score,
                2,
            ),
            "defensive": round(
                defensive_score,
                2,
            ),
            "form": round(
                form_score,
                2,
            ),
            "reliability": round(
                reliability_score,
                2,
            ),
            "discipline": round(
                discipline_score,
                2,
            ),
        }

        weights = {
            "elo": 0.25,
            "squad": 0.15,
            "attacking": 0.18,
            "defensive": 0.18,
            "form": 0.14,
            "reliability": 0.07,
            "discipline": 0.03,
        }

        raw_rating = sum(
            components[key] * weights[key]
            for key in weights
        )

        power_rating = self._clamp(
            raw_rating,
            0.0,
            100.0,
        )

        return {
            "status": "success",
            "version": self.VERSION,
            "team": {
                "id": team.id,
                "sportmonks_id": (
                    team.sportmonks_id
                ),
                "name": team.name,
                "country": team.country,
            },
            "power_rating": round(
                power_rating,
                2,
            ),
            "level": self._rating_level(
                power_rating
            ),
            "components": components,
            "weights": weights,
            "source_data": {
                "elo": team.elo,
                "attack": team.attack,
                "midfield": team.midfield,
                "defense": team.defense,
                "form": team.form,
                "xg": team.xg,
                "xga": team.xga,
                "goals_scored": (
                    team.goals_scored
                ),
                "goals_conceded": (
                    team.goals_conceded
                ),
                "clean_sheets": (
                    team.clean_sheets
                ),
                "failed_to_score": (
                    team.failed_to_score
                ),
            },
        }

    def compare_teams(
        self,
        home_team: Team,
        away_team: Team,
    ) -> dict[str, Any]:
        """
        مقارنة قوة فريقين دون إنشاء توقع مباراة.
        """

        home_result = (
            self.calculate_team_rating(
                home_team
            )
        )

        away_result = (
            self.calculate_team_rating(
                away_team
            )
        )

        home_rating = float(
            home_result["power_rating"]
        )

        away_rating = float(
            away_result["power_rating"]
        )

        difference = round(
            home_rating - away_rating,
            2,
        )

        if difference > 0:
            stronger_team = (
                home_team.name
            )
        elif difference < 0:
            stronger_team = (
                away_team.name
            )
        else:
            stronger_team = "equal"

        return {
            "status": "success",
            "version": self.VERSION,
            "home": home_result,
            "away": away_result,
            "difference": difference,
            "stronger_team": stronger_team,
        }

    def _calculate_squad_score(
        self,
        attack: float,
        midfield: float,
        defense: float,
    ) -> float:
        attack_score = self._clamp(
            attack,
            0.0,
            100.0,
        )

        midfield_score = self._clamp(
            midfield,
            0.0,
            100.0,
        )

        defense_score = self._clamp(
            defense,
            0.0,
            100.0,
        )

        return (
            attack_score * 0.38
            + midfield_score * 0.27
            + defense_score * 0.35
        )

    def _calculate_attacking_score(
        self,
        xg: float,
        goals_scored: float,
        shots: float,
        shots_on_target: float,
    ) -> float:
        xg_score = self._normalize(
            xg,
            minimum=0.20,
            maximum=3.00,
        )

        goals_score = self._normalize(
            goals_scored,
            minimum=0.20,
            maximum=3.00,
        )

        shots_score = self._normalize(
            shots,
            minimum=4.0,
            maximum=22.0,
        )

        shots_on_target_score = (
            self._normalize(
                shots_on_target,
                minimum=1.0,
                maximum=10.0,
            )
        )

        return (
            xg_score * 0.35
            + goals_score * 0.30
            + shots_score * 0.15
            + shots_on_target_score * 0.20
        )

    def _calculate_defensive_score(
        self,
        xga: float,
        goals_conceded: float,
        clean_sheets: float,
    ) -> float:
        xga_score = 100.0 - self._normalize(
            xga,
            minimum=0.20,
            maximum=3.00,
        )

        conceded_score = (
            100.0
            - self._normalize(
                goals_conceded,
                minimum=0.20,
                maximum=3.00,
            )
        )

        clean_sheet_score = (
            self._normalize_percentage(
                clean_sheets
            )
        )

        return (
            xga_score * 0.40
            + conceded_score * 0.35
            + clean_sheet_score * 0.25
        )

    def _calculate_form_score(
        self,
        form: str,
    ) -> float:
        clean_form = "".join(
            character
            for character in form.upper()
            if character in {"W", "D", "L"}
        )[-10:]

        if not clean_form:
            return 50.0

        total_points = sum(
            3
            if result == "W"
            else 1
            if result == "D"
            else 0
            for result in clean_form
        )

        maximum_points = (
            len(clean_form) * 3
        )

        base_score = (
            total_points
            / maximum_points
            * 100.0
        )

        momentum_bonus = 0.0

        recent_results = clean_form[-3:]

        for index, result in enumerate(
            recent_results,
            start=1,
        ):
            multiplier = index / 3

            if result == "W":
                momentum_bonus += (
                    2.0 * multiplier
                )
            elif result == "L":
                momentum_bonus -= (
                    2.0 * multiplier
                )

        return self._clamp(
            base_score + momentum_bonus,
            0.0,
            100.0,
        )

    def _calculate_reliability_score(
        self,
        failed_to_score: float,
        wins: float,
        draws: float,
        losses: float,
    ) -> float:
        scoring_reliability = (
            100.0
            - self._normalize_percentage(
                failed_to_score
            )
        )

        matches = (
            wins
            + draws
            + losses
        )

        if matches <= 0:
            result_score = 50.0
        else:
            points = (
                wins * 3
                + draws
            )

            result_score = (
                points
                / (matches * 3)
                * 100.0
            )

        return (
            scoring_reliability * 0.55
            + result_score * 0.45
        )

    def _calculate_discipline_score(
        self,
        yellow_cards: float,
        red_cards: float,
    ) -> float:
        yellow_penalty = self._normalize(
            yellow_cards,
            minimum=0.0,
            maximum=5.0,
        )

        red_penalty = self._normalize(
            red_cards,
            minimum=0.0,
            maximum=1.0,
        )

        combined_penalty = (
            yellow_penalty * 0.65
            + red_penalty * 0.35
        )

        return self._clamp(
            100.0 - combined_penalty,
            0.0,
            100.0,
        )

    def _normalize_elo(
        self,
        elo: float,
    ) -> float:
        return self._normalize(
            elo,
            minimum=1200.0,
            maximum=2200.0,
        )

    def _normalize_percentage(
        self,
        value: float,
    ) -> float:
        return self._clamp(
            value,
            0.0,
            100.0,
        )

    def _normalize(
        self,
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        if maximum <= minimum:
            return 0.0

        normalized = (
            (value - minimum)
            / (maximum - minimum)
            * 100.0
        )

        return self._clamp(
            normalized,
            0.0,
            100.0,
        )

    def _rating_level(
        self,
        rating: float,
    ) -> str:
        if rating >= 85:
            return "elite"

        if rating >= 75:
            return "very_strong"

        if rating >= 65:
            return "strong"

        if rating >= 55:
            return "average"

        if rating >= 45:
            return "below_average"

        return "weak"

    @staticmethod
    def _number(
        value: Any,
        default: float,
    ) -> float:
        try:
            if value is None:
                return float(default)

            return float(value)

        except (
            TypeError,
            ValueError,
        ):
            return float(default)

    @staticmethod
    def _clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        return max(
            minimum,
            min(
                maximum,
                value,
            ),
        )