from __future__ import annotations

from typing import Any


class AIDecisionEngine:
    """
    طبقة القرار الأولى في Prediction V7.

    تجمع إشارات V6 وتحدد:
    - القرار الموصى به
    - قوة القرار
    - مستوى المخاطرة
    - أسباب القرار
    - التحذيرات

    هذه النسخة لا تعدّل احتمالات Poisson.
    مهمتها تفسير النتيجة وتقييم صلاحيتها.
    """

    MODEL_NAME = "AI Decision Engine V7.0"

    @classmethod
    def evaluate(
        cls,
        v6_result: dict[str, Any],
    ) -> dict[str, Any]:
        if not isinstance(v6_result, dict):
            raise TypeError("v6_result يجب أن يكون من النوع dict.")

        prediction = cls._as_dict(
            v6_result.get("prediction")
        )
        markets = cls._as_dict(
            v6_result.get("markets")
        )
        analysis = cls._as_dict(
            v6_result.get("analysis")
        )
        features = cls._as_dict(
            v6_result.get("features")
        )

        match_result = cls._as_dict(
            markets.get("match_result")
        )
        confidence_data = cls._as_dict(
            prediction.get("confidence")
        )
        expected_goals = cls._as_dict(
            prediction.get("expected_goals")
        )

        probabilities = {
            "home_win": cls._number(
                match_result.get("home_win")
            ),
            "draw": cls._number(
                match_result.get("draw")
            ),
            "away_win": cls._number(
                match_result.get("away_win")
            ),
        }

        ranked_outcomes = sorted(
            probabilities.items(),
            key=lambda item: item[1],
            reverse=True,
        )

        primary_outcome = (
            ranked_outcomes[0][0]
            if ranked_outcomes
            else "unknown"
        )

        primary_probability = (
            ranked_outcomes[0][1]
            if ranked_outcomes
            else 0.0
        )

        second_probability = (
            ranked_outcomes[1][1]
            if len(ranked_outcomes) > 1
            else 0.0
        )

        probability_margin = max(
            0.0,
            primary_probability - second_probability,
        )

        confidence_value = cls._number(
            confidence_data.get("value")
        )
        confidence_level = str(
            confidence_data.get("level") or "Unknown"
        )

        home_xg = cls._number(
            expected_goals.get("home_expected_goals"),
            default=cls._number(
                expected_goals.get("home")
            ),
        )
        away_xg = cls._number(
            expected_goals.get("away_expected_goals"),
            default=cls._number(
                expected_goals.get("away")
            ),
        )

        xg_difference = abs(home_xg - away_xg)
        total_xg = home_xg + away_xg

        confidence_factors = cls._as_dict(
            analysis.get("confidence_factors")
        )

        data_quality = cls._number(
            confidence_factors.get("data_quality")
        )
        form_signal = cls._number(
            confidence_factors.get("form_signal")
        )
        elo_signal = cls._number(
            confidence_factors.get("elo_signal")
        )

        reasons: list[str] = []
        warnings: list[str] = []

        decision_score = 0.0

        # Probability strength
        if primary_probability >= 65:
            decision_score += 30
            reasons.append(
                "الاحتمال الأساسي مرتفع ويدعم القرار."
            )
        elif primary_probability >= 55:
            decision_score += 20
            reasons.append(
                "الاحتمال الأساسي جيد ولكنه ليس حاسمًا."
            )
        elif primary_probability >= 45:
            decision_score += 10
            warnings.append(
                "الاحتمال الأساسي متوسط."
            )
        else:
            warnings.append(
                "لا توجد أفضلية احتمالية واضحة."
            )

        # Probability margin
        if probability_margin >= 20:
            decision_score += 25
            reasons.append(
                "الفارق بين الخيار الأول والثاني واضح."
            )
        elif probability_margin >= 10:
            decision_score += 15
            reasons.append(
                "يوجد فارق مقبول عن أقرب نتيجة منافسة."
            )
        elif probability_margin >= 5:
            decision_score += 5
            warnings.append(
                "الفارق بين الاحتمالات محدود."
            )
        else:
            warnings.append(
                "الاحتمالات متقاربة جدًا."
            )

        # Confidence
        if confidence_value >= 75:
            decision_score += 20
            reasons.append(
                "محرك الثقة يعطي تقييمًا مرتفعًا."
            )
        elif confidence_value >= 60:
            decision_score += 12
            reasons.append(
                "محرك الثقة يعطي تقييمًا جيدًا."
            )
        elif confidence_value >= 45:
            decision_score += 5
            warnings.append(
                "مستوى الثقة متوسط."
            )
        else:
            warnings.append(
                "مستوى الثقة منخفض."
            )

        # Expected goals separation
        if xg_difference >= 0.80:
            decision_score += 15
            reasons.append(
                "فارق الأهداف المتوقعة يدعم وجود أفضلية واضحة."
            )
        elif xg_difference >= 0.40:
            decision_score += 8
            reasons.append(
                "يوجد فارق متوسط في الأهداف المتوقعة."
            )
        else:
            warnings.append(
                "الأهداف المتوقعة متقاربة بين الفريقين."
            )

        # Data quality
        if data_quality >= 70:
            decision_score += 10
            reasons.append(
                "جودة البيانات المستخدمة مرتفعة."
            )
        elif 0 < data_quality < 40:
            warnings.append(
                "جودة البيانات المستخدمة محدودة."
            )

        if elo_signal >= 70:
            reasons.append(
                "إشارة Elo تدعم الاتجاه المتوقع."
            )

        if form_signal >= 70:
            reasons.append(
                "الفورمة الحديثة تدعم الاتجاه المتوقع."
            )

        source_warnings = analysis.get("warnings", [])
        if isinstance(source_warnings, list):
            warnings.extend(
                str(item)
                for item in source_warnings
                if item
            )

        decision_score = round(
            max(0.0, min(decision_score, 100.0)),
            2,
        )

        recommendation = cls._recommendation(
            decision_score=decision_score,
            primary_probability=primary_probability,
            probability_margin=probability_margin,
        )

        risk = cls._risk_level(
            decision_score=decision_score,
            probability_margin=probability_margin,
            confidence_value=confidence_value,
        )

        return {
            "model": cls.MODEL_NAME,
            "recommended_outcome": primary_outcome,
            "recommended_outcome_label": (
                cls._outcome_label(primary_outcome)
            ),
            "primary_probability": round(
                primary_probability,
                2,
            ),
            "second_probability": round(
                second_probability,
                2,
            ),
            "probability_margin": round(
                probability_margin,
                2,
            ),
            "decision_score": decision_score,
            "recommendation": recommendation,
            "risk": risk,
            "expected_goals": {
                "home": round(home_xg, 3),
                "away": round(away_xg, 3),
                "total": round(total_xg, 3),
                "difference": round(
                    xg_difference,
                    3,
                ),
            },
            "confidence": {
                "value": confidence_value,
                "level": confidence_level,
            },
            "reasons": cls._unique(reasons),
            "warnings": cls._unique(warnings),
            "signals": {
                "data_quality": data_quality,
                "form_signal": form_signal,
                "elo_signal": elo_signal,
            },
            "feature_context_available": bool(features),
        }

    @staticmethod
    def _recommendation(
        decision_score: float,
        primary_probability: float,
        probability_margin: float,
    ) -> str:
        if (
            decision_score >= 75
            and primary_probability >= 55
            and probability_margin >= 10
        ):
            return "strong"

        if (
            decision_score >= 55
            and primary_probability >= 45
        ):
            return "moderate"

        if decision_score >= 35:
            return "weak"

        return "reject"

    @staticmethod
    def _risk_level(
        decision_score: float,
        probability_margin: float,
        confidence_value: float,
    ) -> dict[str, str]:
        if (
            decision_score >= 75
            and probability_margin >= 15
            and confidence_value >= 65
        ):
            return {
                "level": "low",
                "label": "Low Risk",
            }

        if (
            decision_score >= 50
            and probability_margin >= 7
        ):
            return {
                "level": "medium",
                "label": "Medium Risk",
            }

        return {
            "level": "high",
            "label": "High Risk",
        }

    @staticmethod
    def _outcome_label(outcome: str) -> str:
        labels = {
            "home_win": "Home Win",
            "draw": "Draw",
            "away_win": "Away Win",
        }

        return labels.get(outcome, outcome)

    @staticmethod
    def _as_dict(value: Any) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

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
    def _unique(values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))
