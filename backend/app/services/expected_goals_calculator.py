from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


class ExpectedGoalsCalculator:
    """
    يحسب الأهداف المتوقعة للفريقين اعتمادًا على:

    - القوة الهجومية الأساسية
    - Attack Analyzer
    - القوة الدفاعية الأساسية
    - Defense Analyzer
    - xG و xGA
    - معدل الأهداف الأخير
    - معدل استقبال الأهداف الأخير
    - الفورمة
    - Elo
    - دقة التسديد
    - معدل الشباك النظيفة
    - أفضلية الأرض
    - جودة وكمية البيانات
    """

    MIN_EXPECTED_GOALS = 0.20
    MAX_EXPECTED_GOALS = 4.50

    DEFAULT_WEIGHTS: Dict[str, Any] = {
        "enabled": False,
        "home_goal_multiplier": 1.0,
        "away_goal_multiplier": 1.0,
        "total_goal_multiplier": 1.0,
        "attack_multiplier": 1.0,
        "home_advantage_multiplier": 1.0,
    }

    WEIGHTS_PATH = (
        Path(__file__).resolve().parents[1]
        / "config"
        / "model_weights_v11.json"
    )

    @classmethod
    def _load_weights(cls) -> Dict[str, Any]:
        """
        Load V11 calibration weights safely.

        Missing, disabled, malformed, or invalid configuration
        falls back to neutral multipliers.
        """

        weights = dict(cls.DEFAULT_WEIGHTS)

        if not cls.WEIGHTS_PATH.exists():
            return weights

        try:
            with cls.WEIGHTS_PATH.open(
                "r",
                encoding="utf-8",
            ) as file:
                loaded = json.load(file)
        except (
            OSError,
            json.JSONDecodeError,
        ):
            return weights

        if not isinstance(loaded, dict):
            return weights

        if loaded.get("enabled") is not True:
            return weights

        weights["enabled"] = True

        weights["home_goal_multiplier"] = (
            cls._safe_multiplier(
                loaded.get("home_goal_multiplier"),
                minimum=0.90,
                maximum=1.10,
            )
        )

        weights["away_goal_multiplier"] = (
            cls._safe_multiplier(
                loaded.get("away_goal_multiplier"),
                minimum=0.90,
                maximum=1.10,
            )
        )

        weights["total_goal_multiplier"] = (
            cls._safe_multiplier(
                loaded.get("total_goal_multiplier"),
                minimum=0.90,
                maximum=1.10,
            )
        )

        # Retained for configuration compatibility and reporting.
        # It is not multiplied into xG to avoid double calibration.
        weights["attack_multiplier"] = (
            cls._safe_multiplier(
                loaded.get("attack_multiplier"),
                minimum=0.90,
                maximum=1.10,
            )
        )

        weights["home_advantage_multiplier"] = (
            cls._safe_multiplier(
                loaded.get("home_advantage_multiplier"),
                minimum=0.95,
                maximum=1.05,
            )
        )

        return weights

    @classmethod
    def _safe_multiplier(
        cls,
        value: Any,
        *,
        minimum: float,
        maximum: float,
    ) -> float:
        multiplier = cls._number(
            value,
            default=1.0,
        )

        return cls._clamp(
            multiplier,
            minimum,
            maximum,
        )

    @classmethod
    def calculate(
        cls,
        features: Dict[str, Any],
    ) -> Dict[str, float]:
        """
        حساب xG وتطبيق معاملات V11 عند تفعيلها.
        """

        weights = cls._load_weights()

        home_expected_goals = cls._calculate_team_expected_goals(
            features=features,
            side="home",
            weights=weights,
        )

        away_expected_goals = cls._calculate_team_expected_goals(
            features=features,
            side="away",
            weights=weights,
        )

        home_expected_goals *= weights[
            "home_goal_multiplier"
        ]
        away_expected_goals *= weights[
            "away_goal_multiplier"
        ]

        current_total = (
            home_expected_goals
            + away_expected_goals
        )

        desired_total = (
            current_total
            * weights["total_goal_multiplier"]
        )

        if current_total > 0:
            total_scaling_factor = (
                desired_total / current_total
            )

            home_expected_goals *= total_scaling_factor
            away_expected_goals *= total_scaling_factor

        home_expected_goals = cls._clamp(
            home_expected_goals,
            cls.MIN_EXPECTED_GOALS,
            cls.MAX_EXPECTED_GOALS,
        )
        away_expected_goals = cls._clamp(
            away_expected_goals,
            cls.MIN_EXPECTED_GOALS,
            cls.MAX_EXPECTED_GOALS,
        )

        total_expected_goals = (
            home_expected_goals
            + away_expected_goals
        )

        return {
            "home_expected_goals": round(
                home_expected_goals,
                2,
            ),
            "away_expected_goals": round(
                away_expected_goals,
                2,
            ),
            "total_expected_goals": round(
                total_expected_goals,
                2,
            ),
        }
    @classmethod
    def _calculate_team_expected_goals(
        cls,
        features: Dict[str, Any],
        side: str,
        weights: Dict[str, Any],
    ) -> float:
        opponent = "away" if side == "home" else "home"

        # ==========================================================
        # Basic team ratings
        # ==========================================================

        base_attack = cls._number(
            features.get(f"{side}_attack"),
            default=70.0,
        )

        analyzed_attack = cls._number(
            features.get(f"{side}_attack_rating"),
            default=base_attack,
        )

        opponent_base_defense = cls._number(
            features.get(f"{opponent}_defense"),
            default=70.0,
        )

        opponent_analyzed_defense = cls._number(
            features.get(f"{opponent}_defense_rating"),
            default=opponent_base_defense,
        )

        # دمج القوة الأساسية مع التحليل الديناميكي الأخير
        blended_attack = (
            base_attack * 0.35
            + analyzed_attack * 0.65
        )

        blended_opponent_defense = (
            opponent_base_defense * 0.35
            + opponent_analyzed_defense * 0.65
        )

        # ==========================================================
        # Goal-production data
        # ==========================================================

        team_xg = cls._number(
            features.get(f"{side}_xg"),
            default=1.30,
        )

        recent_attack_xg = cls._number(
            features.get(f"{side}_attack_xg"),
            default=team_xg,
        )

        recent_avg_goals = cls._number(
            features.get(f"{side}_recent_avg_goals"),
            default=team_xg,
        )

        overall_goals_scored = cls._number(
            features.get(f"{side}_goals_scored"),
            default=recent_avg_goals,
        )

        # ==========================================================
        # Opponent defensive data
        # ==========================================================

        opponent_xga = cls._number(
            features.get(f"{opponent}_xga"),
            default=1.30,
        )

        opponent_recent_xga = cls._number(
            features.get(f"{opponent}_recent_xga"),
            default=opponent_xga,
        )

        opponent_recent_conceded = cls._number(
            features.get(f"{opponent}_recent_conceded"),
            default=opponent_xga,
        )

        opponent_overall_conceded = cls._number(
            features.get(f"{opponent}_goals_conceded"),
            default=opponent_recent_conceded,
        )

        opponent_clean_sheet_rate = cls._normalize_rate(
            features.get(f"{opponent}_clean_sheet_rate"),
            default=0.20,
        )

        # ==========================================================
        # Recent form
        # ==========================================================

        form_points = cls._number(
            features.get(f"{side}_form_points"),
            default=7.5,
        )

        form_factor = cls._form_factor(form_points)

        # ==========================================================
        # Shot quality
        # ==========================================================

        shot_accuracy = cls._number(
            features.get(f"{side}_shot_accuracy"),
            default=35.0,
        )

        shot_accuracy_factor = cls._shot_accuracy_factor(
            shot_accuracy
        )

        # ==========================================================
        # Elo
        # ==========================================================

        team_elo = cls._number(
            features.get(f"{side}_elo"),
            default=1500.0,
        )

        opponent_elo = cls._number(
            features.get(f"{opponent}_elo"),
            default=1500.0,
        )

        elo_factor = cls._elo_factor(
            team_elo=team_elo,
            opponent_elo=opponent_elo,
        )

        # ==========================================================
        # Data reliability
        # ==========================================================

        attack_played = int(
            cls._number(
                features.get(f"{side}_attack_played"),
                default=0.0,
            )
        )

        defense_played = int(
            cls._number(
                features.get(f"{opponent}_defense_played"),
                default=0.0,
            )
        )

        reliability = cls._data_reliability(
            attack_played=attack_played,
            defense_played=defense_played,
        )

        # ==========================================================
        # Base expected goals
        # ==========================================================

        attacking_base = (
            team_xg * 0.24
            + recent_attack_xg * 0.22
            + recent_avg_goals * 0.32
            + overall_goals_scored * 0.22
        )

        defensive_base = (
            opponent_xga * 0.20
            + opponent_recent_xga * 0.30
            + opponent_recent_conceded * 0.35
            + opponent_overall_conceded * 0.15
        )

        base_expected_goals = (
            attacking_base * 0.58
            + defensive_base * 0.42
        )

        # ==========================================================
        # Dynamic factors
        # ==========================================================

        attack_factor = cls._attack_factor(blended_attack)

        defense_factor = cls._defense_factor(
            blended_opponent_defense
        )

        clean_sheet_factor = cls._clean_sheet_factor(
            opponent_clean_sheet_rate
        )

        home_advantage_factor = cls._home_advantage_factor(
            features=features,
            side=side,
        )

        if side == "home":
            home_advantage_factor *= weights[
                "home_advantage_multiplier"
            ]

            home_advantage_factor = cls._clamp(
                home_advantage_factor,
                0.90,
                1.25,
            )

        dynamic_expected_goals = (
            base_expected_goals
            * attack_factor
            * defense_factor
            * form_factor
            * shot_accuracy_factor
            * elo_factor
            * clean_sheet_factor
            * home_advantage_factor
        )

        # عند قلة البيانات نقلل تأثير القيم الديناميكية
        league_baseline = 1.35 if side == "home" else 1.10

        expected_goals = (
            dynamic_expected_goals * reliability
            + league_baseline * (1.0 - reliability)
        )

        return cls._clamp(
            expected_goals,
            cls.MIN_EXPECTED_GOALS,
            cls.MAX_EXPECTED_GOALS,
        )

    @staticmethod
    def _attack_factor(attack_rating: float) -> float:
        """
        تحويل Attack Rating من 0-100 إلى معامل هجومي.

        50 = محايد تقريبًا
        100 = قوة هجومية مرتفعة
        """

        rating = ExpectedGoalsCalculator._clamp(
            attack_rating,
            0.0,
            100.0,
        )

        factor = 0.72 + (rating / 100.0) * 0.58

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.72,
            1.30,
        )

    @staticmethod
    def _defense_factor(defense_rating: float) -> float:
        """
        كلما ارتفع تقييم دفاع الخصم انخفضت أهداف الفريق المتوقعة.
        """

        rating = ExpectedGoalsCalculator._clamp(
            defense_rating,
            0.0,
            100.0,
        )

        factor = 1.28 - (rating / 100.0) * 0.48

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.80,
            1.28,
        )

    @staticmethod
    def _form_factor(form_points: float) -> float:
        """
        يعتمد على مجموع نقاط آخر خمس مباريات تقريبًا.

        0 نقاط  = فورمة ضعيفة جدًا
        7.5     = فورمة متوسطة
        15 نقطة = فورمة ممتازة
        """

        points = ExpectedGoalsCalculator._clamp(
            form_points,
            0.0,
            15.0,
        )

        factor = 0.88 + (points / 15.0) * 0.24

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.88,
            1.12,
        )

    @staticmethod
    def _shot_accuracy_factor(shot_accuracy: float) -> float:
        """
        يدعم القيم بصيغة:
        35
        أو:
        0.35
        """

        accuracy = shot_accuracy

        if 0.0 <= accuracy <= 1.0:
            accuracy *= 100.0

        accuracy = ExpectedGoalsCalculator._clamp(
            accuracy,
            10.0,
            70.0,
        )

        factor = 0.88 + ((accuracy - 10.0) / 60.0) * 0.24

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.88,
            1.12,
        )

    @staticmethod
    def _elo_factor(
        team_elo: float,
        opponent_elo: float,
    ) -> float:
        elo_difference = team_elo - opponent_elo

        elo_difference = ExpectedGoalsCalculator._clamp(
            elo_difference,
            -500.0,
            500.0,
        )

        factor = 1.0 + elo_difference / 2500.0

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.80,
            1.20,
        )

    @staticmethod
    def _clean_sheet_factor(clean_sheet_rate: float) -> float:
        """
        دفاع الخصم الذي يحقق Clean Sheets كثيرًا يقلل xG.
        """

        rate = ExpectedGoalsCalculator._clamp(
            clean_sheet_rate,
            0.0,
            1.0,
        )

        factor = 1.05 - rate * 0.20

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.85,
            1.05,
        )

    @staticmethod
    def _home_advantage_factor(
        features: Dict[str, Any],
        side: str,
    ) -> float:
        home_advantage = ExpectedGoalsCalculator._number(
            features.get("home_advantage"),
            default=5.0,
        )

        home_advantage = ExpectedGoalsCalculator._clamp(
            home_advantage,
            0.0,
            20.0,
        )

        normalized_advantage = home_advantage / 100.0

        if side == "home":
            factor = 1.05 + normalized_advantage
        else:
            factor = 0.97 - normalized_advantage * 0.30

        return ExpectedGoalsCalculator._clamp(
            factor,
            0.90,
            1.25,
        )

    @staticmethod
    def _data_reliability(
        attack_played: int,
        defense_played: int,
    ) -> float:
        """
        يقلل تأثير التحليل الديناميكي عند قلة المباريات.

        0 مباريات  -> اعتماد أكبر على المتوسط العام
        5 مباريات -> موثوقية جيدة
        10 مباريات أو أكثر -> موثوقية مرتفعة
        """

        attack_reliability = min(
            max(attack_played, 0) / 5.0,
            1.0,
        )

        defense_reliability = min(
            max(defense_played, 0) / 5.0,
            1.0,
        )

        reliability = (
            attack_reliability * 0.50
            + defense_reliability * 0.50
        )

        return ExpectedGoalsCalculator._clamp(
            reliability,
            0.35,
            1.0,
        )

    @staticmethod
    def _normalize_rate(
        value: Any,
        default: float = 0.0,
    ) -> float:
        rate = ExpectedGoalsCalculator._number(
            value,
            default=default,
        )

        if rate > 1.0:
            rate /= 100.0

        return ExpectedGoalsCalculator._clamp(
            rate,
            0.0,
            1.0,
        )

    @staticmethod
    def _number(
        value: Any,
        default: float = 0.0,
    ) -> float:
        if value is None:
            return float(default)

        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    @staticmethod
    def _clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        return max(minimum, min(maximum, value))
