from __future__ import annotations

from typing import Any, Dict


class ConfidenceEngine:
    """
    يحسب مستوى الثقة في التوقع النهائي اعتمادًا على:

    - قوة أعلى احتمال في سوق 1X2
    - الفارق بين أعلى احتمال وثاني أعلى احتمال
    - فرق Elo
    - فرق التقييم الهجومي
    - فرق التقييم الدفاعي
    - فرق الفورمة
    - حجم البيانات المستخدمة
    - اتفاق مؤشرات Expected Goals مع نتيجة 1X2
    - توازن المباراة أو وضوح الأفضلية

    ملاحظة:
    قيمة الثقة لا تعني ضمان النتيجة، بل تعبّر عن مدى وضوح
    إشارات النموذج واتفاق مكوناته مع بعضها.
    """

    MODEL_VERSION = "Confidence Engine V1.0"

    MIN_CONFIDENCE = 35.0
    MAX_CONFIDENCE = 95.0

    @classmethod
    def calculate(
        cls,
        features: Dict[str, Any],
        expected_goals: Dict[str, Any],
        poisson_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        يحسب الثقة النهائية.

        Args:
            features:
                مخرجات FeatureEngineering.

            expected_goals:
                مخرجات ExpectedGoalsCalculator.

            poisson_result:
                مخرجات PoissonEngine.

        Returns:
            {
                "confidence": float,
                "level": str,
                "predicted_outcome": str,
                "factors": {...},
                "warnings": [...],
            }
        """

        match_result = poisson_result.get("match_result", {})

        home_probability = cls._number(
            match_result.get("home_win"),
            default=0.0,
        )
        draw_probability = cls._number(
            match_result.get("draw"),
            default=0.0,
        )
        away_probability = cls._number(
            match_result.get("away_win"),
            default=0.0,
        )

        predicted_outcome, highest_probability, second_probability = (
            cls._predicted_outcome(
                home_probability=home_probability,
                draw_probability=draw_probability,
                away_probability=away_probability,
            )
        )

        probability_strength = cls._probability_strength(
            highest_probability
        )

        probability_margin = cls._probability_margin(
            highest_probability=highest_probability,
            second_probability=second_probability,
        )

        elo_signal = cls._elo_signal(
            features=features,
            predicted_outcome=predicted_outcome,
        )

        attack_signal = cls._attack_signal(
            features=features,
            predicted_outcome=predicted_outcome,
        )

        defense_signal = cls._defense_signal(
            features=features,
            predicted_outcome=predicted_outcome,
        )

        form_signal = cls._form_signal(
            features=features,
            predicted_outcome=predicted_outcome,
        )

        data_quality = cls._data_quality(features)

        xg_consistency = cls._xg_consistency(
            expected_goals=expected_goals,
            predicted_outcome=predicted_outcome,
        )

        market_clarity = cls._market_clarity(
            home_probability=home_probability,
            draw_probability=draw_probability,
            away_probability=away_probability,
        )

        # ==========================================================
        # Weighted confidence
        # ==========================================================

        confidence = (
            probability_strength * 0.24
            + probability_margin * 0.18
            + elo_signal * 0.10
            + attack_signal * 0.10
            + defense_signal * 0.10
            + form_signal * 0.08
            + data_quality * 0.12
            + xg_consistency * 0.05
            + market_clarity * 0.03
        )

        warnings = cls._build_warnings(
            features=features,
            expected_goals=expected_goals,
            home_probability=home_probability,
            draw_probability=draw_probability,
            away_probability=away_probability,
            probability_margin=probability_margin,
            data_quality=data_quality,
        )

        confidence = cls._apply_warning_penalty(
            confidence=confidence,
            warnings=warnings,
        )

        confidence = cls._clamp(
            confidence,
            cls.MIN_CONFIDENCE,
            cls.MAX_CONFIDENCE,
        )

        confidence = round(confidence, 2)

        return {
            "model": cls.MODEL_VERSION,
            "confidence": confidence,
            "level": cls._confidence_level(confidence),
            "predicted_outcome": predicted_outcome,
            "predicted_outcome_label": cls._outcome_label(
                predicted_outcome
            ),
            "highest_probability": round(highest_probability, 2),
            "probability_margin": round(
                highest_probability - second_probability,
                2,
            ),
            "factors": {
                "probability_strength": round(
                    probability_strength,
                    2,
                ),
                "probability_margin": round(
                    probability_margin,
                    2,
                ),
                "elo_signal": round(elo_signal, 2),
                "attack_signal": round(attack_signal, 2),
                "defense_signal": round(defense_signal, 2),
                "form_signal": round(form_signal, 2),
                "data_quality": round(data_quality, 2),
                "xg_consistency": round(xg_consistency, 2),
                "market_clarity": round(market_clarity, 2),
            },
            "warnings": warnings,
        }

    # ==============================================================
    # Probability analysis
    # ==============================================================

    @staticmethod
    def _predicted_outcome(
        home_probability: float,
        draw_probability: float,
        away_probability: float,
    ) -> tuple[str, float, float]:
        probabilities = [
            ("home_win", home_probability),
            ("draw", draw_probability),
            ("away_win", away_probability),
        ]

        probabilities.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        return (
            probabilities[0][0],
            probabilities[0][1],
            probabilities[1][1],
        )

    @classmethod
    def _probability_strength(
        cls,
        highest_probability: float,
    ) -> float:
        """
        يحوّل أعلى احتمال في 1X2 إلى تقييم من 0 إلى 100.

        33% تقريبًا = مباراة متوازنة
        50% = أفضلية واضحة نسبيًا
        70% أو أكثر = أفضلية قوية
        """

        probability = cls._clamp(
            highest_probability,
            0.0,
            100.0,
        )

        score = (
            (probability - 33.0)
            / (70.0 - 33.0)
            * 100.0
        )

        return cls._clamp(score, 0.0, 100.0)

    @classmethod
    def _probability_margin(
        cls,
        highest_probability: float,
        second_probability: float,
    ) -> float:
        """
        يقيس الفارق بين أعلى احتمال وثاني أعلى احتمال.

        كلما زاد الفارق كان التوقع أوضح.
        """

        margin = max(
            0.0,
            highest_probability - second_probability,
        )

        score = margin / 35.0 * 100.0

        return cls._clamp(score, 0.0, 100.0)

    @classmethod
    def _market_clarity(
        cls,
        home_probability: float,
        draw_probability: float,
        away_probability: float,
    ) -> float:
        probabilities = sorted(
            [
                home_probability,
                draw_probability,
                away_probability,
            ],
            reverse=True,
        )

        if not probabilities:
            return 0.0

        spread = probabilities[0] - probabilities[-1]

        return cls._clamp(
            spread / 60.0 * 100.0,
            0.0,
            100.0,
        )

    # ==============================================================
    # Team signal analysis
    # ==============================================================

    @classmethod
    def _elo_signal(
        cls,
        features: Dict[str, Any],
        predicted_outcome: str,
    ) -> float:
        home_elo = cls._number(
            features.get("home_elo"),
            default=1500.0,
        )
        away_elo = cls._number(
            features.get("away_elo"),
            default=1500.0,
        )

        difference = home_elo - away_elo

        return cls._directional_signal(
            difference=difference,
            predicted_outcome=predicted_outcome,
            full_strength_difference=300.0,
        )

    @classmethod
    def _attack_signal(
        cls,
        features: Dict[str, Any],
        predicted_outcome: str,
    ) -> float:
        home_attack = cls._number(
            features.get("home_attack_rating"),
            default=cls._number(
                features.get("home_attack"),
                default=50.0,
            ),
        )

        away_attack = cls._number(
            features.get("away_attack_rating"),
            default=cls._number(
                features.get("away_attack"),
                default=50.0,
            ),
        )

        difference = home_attack - away_attack

        return cls._directional_signal(
            difference=difference,
            predicted_outcome=predicted_outcome,
            full_strength_difference=30.0,
        )

    @classmethod
    def _defense_signal(
        cls,
        features: Dict[str, Any],
        predicted_outcome: str,
    ) -> float:
        home_defense = cls._number(
            features.get("home_defense_rating"),
            default=cls._number(
                features.get("home_defense"),
                default=50.0,
            ),
        )

        away_defense = cls._number(
            features.get("away_defense_rating"),
            default=cls._number(
                features.get("away_defense"),
                default=50.0,
            ),
        )

        difference = home_defense - away_defense

        return cls._directional_signal(
            difference=difference,
            predicted_outcome=predicted_outcome,
            full_strength_difference=30.0,
        )

    @classmethod
    def _form_signal(
        cls,
        features: Dict[str, Any],
        predicted_outcome: str,
    ) -> float:
        home_form = cls._number(
            features.get("home_form_points"),
            default=7.5,
        )

        away_form = cls._number(
            features.get("away_form_points"),
            default=7.5,
        )

        difference = home_form - away_form

        return cls._directional_signal(
            difference=difference,
            predicted_outcome=predicted_outcome,
            full_strength_difference=10.0,
        )

    @classmethod
    def _directional_signal(
        cls,
        difference: float,
        predicted_outcome: str,
        full_strength_difference: float,
    ) -> float:
        """
        يقيّم مدى اتفاق المؤشر مع النتيجة المتوقعة.

        مثال:
        فرق Elo موجب ونتيجة متوقعة Home Win -> اتفاق مرتفع.
        فرق Elo سالب ونتيجة متوقعة Home Win -> اتفاق منخفض.
        في حالة Draw، الفروق الصغيرة ترفع التقييم.
        """

        if full_strength_difference <= 0:
            return 50.0

        if predicted_outcome == "draw":
            closeness = 1.0 - min(
                abs(difference) / full_strength_difference,
                1.0,
            )

            return cls._clamp(
                40.0 + closeness * 60.0,
                0.0,
                100.0,
            )

        signed_difference = (
            difference
            if predicted_outcome == "home_win"
            else -difference
        )

        normalized = cls._clamp(
            signed_difference / full_strength_difference,
            -1.0,
            1.0,
        )

        score = 50.0 + normalized * 50.0

        return cls._clamp(score, 0.0, 100.0)

    # ==============================================================
    # xG agreement
    # ==============================================================

    @classmethod
    def _xg_consistency(
        cls,
        expected_goals: Dict[str, Any],
        predicted_outcome: str,
    ) -> float:
        home_xg = cls._number(
            expected_goals.get("home_expected_goals"),
            default=1.30,
        )
        away_xg = cls._number(
            expected_goals.get("away_expected_goals"),
            default=1.10,
        )

        difference = home_xg - away_xg

        return cls._directional_signal(
            difference=difference,
            predicted_outcome=predicted_outcome,
            full_strength_difference=1.50,
        )

    # ==============================================================
    # Data quality
    # ==============================================================

    @classmethod
    def _data_quality(
        cls,
        features: Dict[str, Any],
    ) -> float:
        """
        Calculate the available-data quality score.

        Supports:
        1. Feature Engineering V2 nested structure:
           features["home_team"], features["away_team"]

        2. Legacy flat feature structure:
           features["home_attack_played"], etc.
        """

        if not isinstance(features, dict):
            return 0.0

        home_team = features.get("home_team")
        away_team = features.get("away_team")

        home_team = (
            home_team
            if isinstance(home_team, dict)
            else {}
        )
        away_team = (
            away_team
            if isinstance(away_team, dict)
            else {}
        )

        uses_nested_structure = bool(home_team or away_team)


        # ==========================================================
        # Feature Engineering V2
        # ==========================================================
        if uses_nested_structure:
            home_matches_played = cls._number(
                home_team.get("matches_played"),
                default=0.0,
            )
            away_matches_played = cls._number(
                away_team.get("matches_played"),
                default=0.0,
            )

            played_values = [
                home_matches_played,
                away_matches_played,
            ]

            match_coverage = (
                sum(
                    min(max(value, 0.0) / 5.0, 1.0)
                    for value in played_values
                )
                / len(played_values)
            )

            important_values = [
                home_team.get("attack"),
                away_team.get("attack"),
                home_team.get("defense"),
                away_team.get("defense"),
                home_team.get("xg"),
                away_team.get("xg"),
                home_team.get("xga"),
                away_team.get("xga"),
                home_team.get("form_rating"),
                away_team.get("form_rating"),
                home_team.get("elo"),
                away_team.get("elo"),
            ]

            available_fields = sum(
                1
                for value in important_values
                if value is not None
            )

            field_coverage = (
                available_fields / len(important_values)
                if important_values
                else 0.0
            )

        # ==========================================================
        # Legacy flat features
        # ==========================================================
        else:
            home_attack_played = cls._number(
                features.get("home_attack_played"),
                default=0.0,
            )
            away_attack_played = cls._number(
                features.get("away_attack_played"),
                default=0.0,
            )
            home_defense_played = cls._number(
                features.get("home_defense_played"),
                default=0.0,
            )
            away_defense_played = cls._number(
                features.get("away_defense_played"),
                default=0.0,
            )

            played_values = [
                home_attack_played,
                away_attack_played,
                home_defense_played,
                away_defense_played,
            ]

            match_coverage = (
                sum(
                    min(max(value, 0.0) / 5.0, 1.0)
                    for value in played_values
                )
                / len(played_values)
            )

            important_fields = [
                "home_attack_rating",
                "away_attack_rating",
                "home_defense_rating",
                "away_defense_rating",
                "home_xg",
                "away_xg",
                "home_recent_xga",
                "away_recent_xga",
                "home_form_points",
                "away_form_points",
                "home_elo",
                "away_elo",
            ]

            available_fields = sum(
                1
                for field in important_fields
                if features.get(field) is not None
            )

            field_coverage = (
                available_fields / len(important_fields)
                if important_fields
                else 0.0
            )

        quality = (
            match_coverage * 0.65
            + field_coverage * 0.35
        ) * 100.0

        return round(
            cls._clamp(quality, 0.0, 100.0),
            2,
        )
    # ==============================================================
    # Warnings and penalties
    # ==============================================================

    @classmethod
    def _build_warnings(
        cls,
        features: Dict[str, Any],
        expected_goals: Dict[str, Any],
        home_probability: float,
        draw_probability: float,
        away_probability: float,
        probability_margin: float,
        data_quality: float,
    ) -> list[str]:
        warnings: list[str] = []

        if data_quality < 55.0:
            warnings.append(
                "كمية البيانات المتاحة منخفضة، لذلك يجب التعامل مع التوقع بحذر."
            )

        probabilities = sorted(
            [
                home_probability,
                draw_probability,
                away_probability,
            ],
            reverse=True,
        )

        if len(probabilities) >= 2:
            raw_margin = probabilities[0] - probabilities[1]

            if raw_margin < 7.0:
                warnings.append(
                    "المباراة متقاربة ولا توجد أفضلية واضحة في سوق 1X2."
                )

        total_xg = cls._number(
            expected_goals.get("total_expected_goals"),
            default=2.4,
        )

        if total_xg >= 4.25:
            warnings.append(
                "إجمالي الأهداف المتوقعة مرتفع جدًا وقد يزيد تقلب النتيجة."
            )

        if total_xg <= 1.40:
            warnings.append(
                "إجمالي الأهداف المتوقعة منخفض وقد تحسم المباراة بتفاصيل صغيرة."
            )

        home_form = cls._number(
            features.get("home_form_points"),
            default=7.5,
        )
        away_form = cls._number(
            features.get("away_form_points"),
            default=7.5,
        )

        if abs(home_form - away_form) <= 1.0:
            warnings.append(
                "فورمة الفريقين متقاربة جدًا."
            )

        home_elo = cls._number(
            features.get("home_elo"),
            default=1500.0,
        )
        away_elo = cls._number(
            features.get("away_elo"),
            default=1500.0,
        )

        if abs(home_elo - away_elo) <= 35.0:
            warnings.append(
                "تصنيف Elo متقارب بين الفريقين."
            )

        return warnings

    @classmethod
    def _apply_warning_penalty(
        cls,
        confidence: float,
        warnings: list[str],
    ) -> float:
        penalty = min(len(warnings) * 2.0, 10.0)

        return confidence - penalty

    # ==============================================================
    # Output helpers
    # ==============================================================

    @staticmethod
    def _confidence_level(confidence: float) -> str:
        if confidence >= 82.0:
            return "Very High"

        if confidence >= 72.0:
            return "High"

        if confidence >= 60.0:
            return "Medium"

        if confidence >= 48.0:
            return "Low"

        return "Very Low"

    @staticmethod
    def _outcome_label(outcome: str) -> str:
        labels = {
            "home_win": "Home Win",
            "draw": "Draw",
            "away_win": "Away Win",
        }

        return labels.get(outcome, outcome)

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
    