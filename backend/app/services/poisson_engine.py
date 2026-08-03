from __future__ import annotations

from math import exp, factorial
from typing import Any, Dict, List, Tuple


class PoissonEngine:
    """
    محرك احتمالات يعتمد على توزيع بواسون.

    المدخلات:
        home_expected_goals
        away_expected_goals

    المخرجات:
        - مصفوفة النتائج
        - احتمالات 1X2
        - BTTS
        - Over / Under
        - أكثر النتائج احتمالًا
        - النتيجة الأكثر احتمالًا
    """

    DEFAULT_MAX_GOALS = 8
    MIN_LAMBDA = 0.01
    MAX_LAMBDA = 8.00

    @classmethod
    def calculate(
        cls,
        home_expected_goals: float,
        away_expected_goals: float,
        max_goals: int = DEFAULT_MAX_GOALS,
        top_scores_count: int = 10,
    ) -> Dict[str, Any]:
        """
        يحسب جميع أسواق الاحتمالات الأساسية.

        Args:
            home_expected_goals: أهداف صاحب الأرض المتوقعة.
            away_expected_goals: أهداف الضيف المتوقعة.
            max_goals: أعلى عدد أهداف لكل فريق داخل المصفوفة.
            top_scores_count: عدد النتائج الدقيقة الأعلى احتمالًا.

        Returns:
            قاموس يحتوي على جميع الاحتمالات.
        """

        home_xg = cls._sanitize_lambda(home_expected_goals)
        away_xg = cls._sanitize_lambda(away_expected_goals)
        max_goals = cls._sanitize_max_goals(max_goals)
        top_scores_count = max(1, int(top_scores_count))

        home_goal_probabilities = cls._goal_probabilities(
            expected_goals=home_xg,
            max_goals=max_goals,
        )
        away_goal_probabilities = cls._goal_probabilities(
            expected_goals=away_xg,
            max_goals=max_goals,
        )

        score_matrix = cls._build_score_matrix(
            home_probabilities=home_goal_probabilities,
            away_probabilities=away_goal_probabilities,
        )

        matrix_total = sum(
            probability
            for row in score_matrix
            for probability in row
        )

        if matrix_total <= 0:
            raise ValueError("تعذر إنشاء مصفوفة احتمالات صحيحة.")

        normalized_matrix = cls._normalize_matrix(
            score_matrix=score_matrix,
            total_probability=matrix_total,
        )

        one_x_two = cls._calculate_one_x_two(normalized_matrix)
        btts = cls._calculate_btts(normalized_matrix)
        totals = cls._calculate_totals(normalized_matrix)
        top_scores = cls._calculate_top_scores(
            normalized_matrix,
            top_scores_count,
        )
        double_chance = cls._calculate_double_chance(one_x_two)
        draw_no_bet = cls._calculate_draw_no_bet(one_x_two)

        most_likely_score = top_scores[0]

        return {
            "model": "Poisson Engine V1.0",
            "input": {
                "home_expected_goals": round(home_xg, 3),
                "away_expected_goals": round(away_xg, 3),
                "total_expected_goals": round(home_xg + away_xg, 3),
                "max_goals": max_goals,
            },
            "most_likely_score": most_likely_score,
            "top_scores": top_scores,
            "match_result": one_x_two,
            "double_chance": double_chance,
            "draw_no_bet": draw_no_bet,
            "btts": btts,
            "totals": totals,
            "team_totals": {
                "home": cls._calculate_team_totals(
                    normalized_matrix,
                    team="home",
                ),
                "away": cls._calculate_team_totals(
                    normalized_matrix,
                    team="away",
                ),
            },
            "clean_sheet": cls._calculate_clean_sheets(normalized_matrix),
            "win_to_nil": cls._calculate_win_to_nil(normalized_matrix),
            "score_matrix": cls._serialize_matrix(normalized_matrix),
        }

    @classmethod
    def _goal_probabilities(
        cls,
        expected_goals: float,
        max_goals: int,
    ) -> List[float]:
        probabilities = [
            cls._poisson_probability(expected_goals, goals)
            for goals in range(max_goals + 1)
        ]

        return probabilities

    @staticmethod
    def _poisson_probability(
        expected_goals: float,
        goals: int,
    ) -> float:
        if goals < 0:
            return 0.0

        return (
            exp(-expected_goals)
            * (expected_goals ** goals)
            / factorial(goals)
        )

    @staticmethod
    def _build_score_matrix(
        home_probabilities: List[float],
        away_probabilities: List[float],
    ) -> List[List[float]]:
        return [
            [
                home_probability * away_probability
                for away_probability in away_probabilities
            ]
            for home_probability in home_probabilities
        ]

    @staticmethod
    def _normalize_matrix(
        score_matrix: List[List[float]],
        total_probability: float,
    ) -> List[List[float]]:
        return [
            [
                probability / total_probability
                for probability in row
            ]
            for row in score_matrix
        ]

    @staticmethod
    def _calculate_one_x_two(
        score_matrix: List[List[float]],
    ) -> Dict[str, float]:
        home_win = 0.0
        draw = 0.0
        away_win = 0.0

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                if home_goals > away_goals:
                    home_win += probability
                elif home_goals == away_goals:
                    draw += probability
                else:
                    away_win += probability

        return {
            "home_win": PoissonEngine._percent(home_win),
            "draw": PoissonEngine._percent(draw),
            "away_win": PoissonEngine._percent(away_win),
        }

    @staticmethod
    def _calculate_double_chance(
        one_x_two: Dict[str, float],
    ) -> Dict[str, float]:
        return {
            "home_or_draw_1x": round(
                one_x_two["home_win"] + one_x_two["draw"],
                2,
            ),
            "home_or_away_12": round(
                one_x_two["home_win"] + one_x_two["away_win"],
                2,
            ),
            "draw_or_away_x2": round(
                one_x_two["draw"] + one_x_two["away_win"],
                2,
            ),
        }

    @staticmethod
    def _calculate_draw_no_bet(
        one_x_two: Dict[str, float],
    ) -> Dict[str, float]:
        non_draw_total = (
            one_x_two["home_win"]
            + one_x_two["away_win"]
        )

        if non_draw_total <= 0:
            return {
                "home": 50.0,
                "away": 50.0,
            }

        return {
            "home": round(
                one_x_two["home_win"] / non_draw_total * 100.0,
                2,
            ),
            "away": round(
                one_x_two["away_win"] / non_draw_total * 100.0,
                2,
            ),
        }

    @staticmethod
    def _calculate_btts(
        score_matrix: List[List[float]],
    ) -> Dict[str, float]:
        btts_yes = 0.0
        btts_no = 0.0

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                if home_goals > 0 and away_goals > 0:
                    btts_yes += probability
                else:
                    btts_no += probability

        return {
            "yes": PoissonEngine._percent(btts_yes),
            "no": PoissonEngine._percent(btts_no),
        }

    @classmethod
    def _calculate_totals(
        cls,
        score_matrix: List[List[float]],
    ) -> Dict[str, Dict[str, float]]:
        lines = (0.5, 1.5, 2.5, 3.5, 4.5, 5.5)

        return {
            str(line): cls._total_line_probability(
                score_matrix,
                line,
            )
            for line in lines
        }

    @classmethod
    def _total_line_probability(
        cls,
        score_matrix: List[List[float]],
        line: float,
    ) -> Dict[str, float]:
        over = 0.0
        under = 0.0

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                total_goals = home_goals + away_goals

                if total_goals > line:
                    over += probability
                else:
                    under += probability

        return {
            "over": cls._percent(over),
            "under": cls._percent(under),
        }

    @classmethod
    def _calculate_team_totals(
        cls,
        score_matrix: List[List[float]],
        team: str,
    ) -> Dict[str, Dict[str, float]]:
        lines = (0.5, 1.5, 2.5, 3.5)

        return {
            str(line): cls._team_total_line_probability(
                score_matrix=score_matrix,
                team=team,
                line=line,
            )
            for line in lines
        }

    @classmethod
    def _team_total_line_probability(
        cls,
        score_matrix: List[List[float]],
        team: str,
        line: float,
    ) -> Dict[str, float]:
        over = 0.0
        under = 0.0

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                goals = (
                    home_goals
                    if team == "home"
                    else away_goals
                )

                if goals > line:
                    over += probability
                else:
                    under += probability

        return {
            "over": cls._percent(over),
            "under": cls._percent(under),
        }

    @classmethod
    def _calculate_top_scores(
        cls,
        score_matrix: List[List[float]],
        count: int,
    ) -> List[Dict[str, Any]]:
        scores: List[Tuple[int, int, float]] = []

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                scores.append(
                    (home_goals, away_goals, probability)
                )

        scores.sort(
            key=lambda item: item[2],
            reverse=True,
        )

        return [
            {
                "home_goals": home_goals,
                "away_goals": away_goals,
                "score": f"{home_goals}-{away_goals}",
                "probability": cls._percent(probability),
            }
            for home_goals, away_goals, probability
            in scores[:count]
        ]

    @classmethod
    def _calculate_clean_sheets(
        cls,
        score_matrix: List[List[float]],
    ) -> Dict[str, float]:
        home_clean_sheet = 0.0
        away_clean_sheet = 0.0
        both_clean_sheet = 0.0

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                if away_goals == 0:
                    home_clean_sheet += probability

                if home_goals == 0:
                    away_clean_sheet += probability

                if home_goals == 0 and away_goals == 0:
                    both_clean_sheet += probability

        return {
            "home": cls._percent(home_clean_sheet),
            "away": cls._percent(away_clean_sheet),
            "both_0_0": cls._percent(both_clean_sheet),
        }

    @classmethod
    def _calculate_win_to_nil(
        cls,
        score_matrix: List[List[float]],
    ) -> Dict[str, float]:
        home_win_to_nil = 0.0
        away_win_to_nil = 0.0

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                if home_goals > 0 and away_goals == 0:
                    home_win_to_nil += probability

                if away_goals > 0 and home_goals == 0:
                    away_win_to_nil += probability

        return {
            "home": cls._percent(home_win_to_nil),
            "away": cls._percent(away_win_to_nil),
        }

    @classmethod
    def _serialize_matrix(
        cls,
        score_matrix: List[List[float]],
    ) -> List[Dict[str, Any]]:
        serialized: List[Dict[str, Any]] = []

        for home_goals, row in enumerate(score_matrix):
            for away_goals, probability in enumerate(row):
                serialized.append(
                    {
                        "home_goals": home_goals,
                        "away_goals": away_goals,
                        "score": f"{home_goals}-{away_goals}",
                        "probability": cls._percent(probability),
                    }
                )

        return serialized

    @classmethod
    def _sanitize_lambda(cls, value: Any) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "يجب أن تكون قيمة الأهداف المتوقعة رقمًا."
            ) from exc

        return cls._clamp(
            number,
            cls.MIN_LAMBDA,
            cls.MAX_LAMBDA,
        )

    @staticmethod
    def _sanitize_max_goals(value: Any) -> int:
        try:
            max_goals = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "max_goals يجب أن يكون عددًا صحيحًا."
            ) from exc

        return max(5, min(max_goals, 15))

    @staticmethod
    def _percent(probability: float) -> float:
        return round(probability * 100.0, 2)

    @staticmethod
    def _clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        return max(minimum, min(maximum, value))