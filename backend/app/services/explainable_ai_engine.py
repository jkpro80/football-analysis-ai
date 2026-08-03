from __future__ import annotations

from typing import Any


class ExplainableAIEngine:
    """
    Converts Prediction V6/V7 numerical output into a clear explanation.

    This engine does not change probabilities or expected goals.
    It only explains the result produced by the prediction engines.
    """

    MODEL_VERSION = "Explainable AI 1.0"

    def explain(
        self,
        prediction: dict[str, Any],
        decision: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        decision = decision or {}

        probabilities = self._extract_probabilities(prediction)
        expected_goals = self._extract_expected_goals(prediction, decision)

        recommended_outcome = (
            decision.get("recommended_outcome")
            or decision.get("outcome")
            or self._select_outcome(probabilities)
        )

        confidence = self._extract_confidence(prediction, decision)
        risk_data = decision.get("risk", "medium")
        if isinstance(risk_data, dict):
            risk_level = str(risk_data.get("level", "medium")).lower()
        else:
            risk_level = str(risk_data).lower()

        strengths = self._build_strengths(
            probabilities=probabilities,
            expected_goals=expected_goals,
            recommended_outcome=recommended_outcome,
            confidence=confidence,
        )

        risks = self._build_risks(
            probabilities=probabilities,
            expected_goals=expected_goals,
            risk_level=risk_level,
        )

        summary = self._build_summary(
            recommended_outcome=recommended_outcome,
            probabilities=probabilities,
            expected_goals=expected_goals,
            confidence=confidence,
            risk_level=risk_level,
        )

        return {
            "summary": summary,
            "recommended_outcome": recommended_outcome,
            "strengths": strengths,
            "risks": risks,
            "factors": {
                "probabilities": probabilities,
                "expected_goals": expected_goals,
                "confidence": round(confidence, 4),
                "risk_level": risk_level,
            },
            "model": self.MODEL_VERSION,
        }

    def _extract_probabilities(
        self,
        prediction: dict[str, Any],
    ) -> dict[str, float]:
        source: dict[str, Any] = {}

        markets = prediction.get("markets")
        if isinstance(markets, dict):
            match_result = markets.get("match_result")
            if isinstance(match_result, dict):
                source = match_result

        if not source:
            poisson = prediction.get("poisson")
            if isinstance(poisson, dict):
                match_result = poisson.get("match_result")
                if isinstance(match_result, dict):
                    source = match_result

        if not source:
            probabilities = prediction.get("probabilities")
            if isinstance(probabilities, dict):
                source = probabilities

        if not source:
            legacy_prediction = prediction.get("prediction")
            if isinstance(legacy_prediction, dict):
                source = legacy_prediction

        home = self._first_number(
            source,
            ["home_win", "home", "1", "home_probability"],
        )
        draw = self._first_number(
            source,
            ["draw", "x", "draw_probability"],
        )
        away = self._first_number(
            source,
            ["away_win", "away", "2", "away_probability"],
        )

        return {
            "home_win": self._normalise_probability(home),
            "draw": self._normalise_probability(draw),
            "away_win": self._normalise_probability(away),
        }

    def _extract_expected_goals(
        self,
        prediction: dict[str, Any],
        decision: dict[str, Any] | None = None,
    ) -> dict[str, float]:
        decision = decision or {}
        source: dict[str, Any] = {}

        decision_xg = decision.get("expected_goals")
        if isinstance(decision_xg, dict):
            source = decision_xg

        if not source:
            prediction_xg = prediction.get("expected_goals")
            if isinstance(prediction_xg, dict):
                source = prediction_xg

        if not source:
            legacy_xg = prediction.get("xg")
            if isinstance(legacy_xg, dict):
                source = legacy_xg

        if not source:
            poisson = prediction.get("poisson")
            if isinstance(poisson, dict):
                poisson_input = poisson.get("input")
                if isinstance(poisson_input, dict):
                    source = poisson_input

        if not source:
            analysis = prediction.get("analysis")
            if isinstance(analysis, dict):
                analysis_xg = analysis.get("expected_goals")
                if isinstance(analysis_xg, dict):
                    source = analysis_xg

        home = self._first_number(
            source,
            [
                "home",
                "home_xg",
                "expected_home_goals",
                "home_expected_goals",
            ],
        )
        away = self._first_number(
            source,
            [
                "away",
                "away_xg",
                "expected_away_goals",
                "away_expected_goals",
            ],
        )
        total = self._first_number(
            source,
            [
                "total",
                "total_xg",
                "expected_total_goals",
                "total_expected_goals",
            ],
        )

        if total == 0.0 and (home > 0.0 or away > 0.0):
            total = home + away

        return {
            "home": round(home, 3),
            "away": round(away, 3),
            "total": round(total, 3),
        }

    def _extract_confidence(
        self,
        prediction: dict[str, Any],
        decision: dict[str, Any],
    ) -> float:
        candidates: list[Any] = []

        decision_confidence = decision.get("confidence")

        if isinstance(decision_confidence, dict):
            candidates.extend(
                [
                    decision_confidence.get("value"),
                    decision_confidence.get("score"),
                    decision_confidence.get("overall"),
                    decision_confidence.get("confidence_score"),
                ]
            )
        else:
            candidates.append(decision_confidence)

        prediction_confidence = prediction.get("confidence")

        if isinstance(prediction_confidence, dict):
            candidates.extend(
                [
                    prediction_confidence.get("value"),
                    prediction_confidence.get("score"),
                    prediction_confidence.get("overall"),
                    prediction_confidence.get("confidence_score"),
                ]
            )
        else:
            candidates.append(prediction_confidence)

        candidates.extend(
            [
                prediction.get("confidence_score"),
                decision.get("decision_score"),
            ]
        )

        for value in candidates:
            number = self._to_float(value)

            if number is not None:
                return self._normalise_probability(number)

        return 0.0

    def _select_outcome(
        self,
        probabilities: dict[str, float],
    ) -> str:
        if not any(probabilities.values()):
            return "uncertain"

        outcome = max(probabilities, key=probabilities.get)

        labels = {
            "home_win": "home_win",
            "draw": "draw",
            "away_win": "away_win",
        }

        return labels[outcome]

    def _build_strengths(
        self,
        probabilities: dict[str, float],
        expected_goals: dict[str, float],
        recommended_outcome: str,
        confidence: float,
    ) -> list[str]:
        strengths: list[str] = []

        highest_probability = max(probabilities.values(), default=0.0)

        if highest_probability >= 0.60:
            strengths.append(
                "The recommended outcome has a strong probability advantage."
            )
        elif highest_probability >= 0.45:
            strengths.append(
                "The recommended outcome has a moderate probability advantage."
            )

        home_xg = expected_goals["home"]
        away_xg = expected_goals["away"]
        xg_difference = abs(home_xg - away_xg)

        if xg_difference >= 1.0:
            stronger_team = "home team" if home_xg > away_xg else "away team"
            strengths.append(
                f"The {stronger_team} has a clear expected-goals advantage "
                f"of {xg_difference:.2f}."
            )
        elif xg_difference >= 0.45:
            stronger_team = "home team" if home_xg > away_xg else "away team"
            strengths.append(
                f"The {stronger_team} has a measurable expected-goals advantage."
            )

        if expected_goals["total"] >= 3.0:
            strengths.append(
                "The model expects an open match with relatively high scoring potential."
            )

        if confidence >= 0.70:
            strengths.append("The prediction confidence is high.")
        elif confidence >= 0.55:
            strengths.append("The prediction confidence is acceptable.")

        if not strengths:
            strengths.append(
                "The recommendation is based on the combined V6 model output."
            )

        return strengths

    def _build_risks(
        self,
        probabilities: dict[str, float],
        expected_goals: dict[str, float],
        risk_level: str,
    ) -> list[str]:
        risks: list[str] = []

        sorted_probabilities = sorted(
            probabilities.values(),
            reverse=True,
        )

        if len(sorted_probabilities) >= 2:
            probability_gap = (
                sorted_probabilities[0] - sorted_probabilities[1]
            )

            if probability_gap < 0.08:
                risks.append(
                    "The leading outcomes are very close, making the match difficult to predict."
                )
            elif probability_gap < 0.15:
                risks.append(
                    "The probability advantage is limited and the result remains competitive."
                )

        if probabilities["draw"] >= 0.30:
            risks.append("The draw probability is significant.")

        xg_difference = abs(
            expected_goals["home"] - expected_goals["away"]
        )

        if (
            expected_goals["total"] > 0.0
            and xg_difference < 0.30
        ):
            risks.append(
                "Expected goals are closely balanced between both teams."
            )

        if expected_goals["total"] < 1.8 and expected_goals["total"] > 0.0:
            risks.append(
                "Low expected scoring increases the impact of a single event."
            )

        if risk_level == "high":
            risks.append("The AI Decision Engine classified this prediction as high risk.")
        elif risk_level == "medium":
            risks.append("The prediction carries a moderate level of uncertainty.")

        if not risks:
            risks.append(
                "No major statistical warning was detected, but match outcomes remain uncertain."
            )

        return risks

    def _build_summary(
        self,
        recommended_outcome: str,
        probabilities: dict[str, float],
        expected_goals: dict[str, float],
        confidence: float,
        risk_level: str,
    ) -> str:
        labels = {
            "home_win": "a home win",
            "home": "a home win",
            "draw": "a draw",
            "away_win": "an away win",
            "away": "an away win",
            "uncertain": "no clear outcome",
        }

        outcome_label = labels.get(
            str(recommended_outcome).lower(),
            str(recommended_outcome).replace("_", " "),
        )

        highest_probability = max(
            probabilities.values(),
            default=0.0,
        )

        probability_text = (
            f"{highest_probability * 100:.1f}%"
            if highest_probability > 0.0
            else "an unavailable probability"
        )

        xg_text = ""

        if expected_goals["total"] > 0.0:
            xg_text = (
                f" Expected goals are {expected_goals['home']:.2f} "
                f"for the home team and {expected_goals['away']:.2f} "
                f"for the away team."
            )

        confidence_text = (
            f" Confidence is {confidence * 100:.1f}%."
            if confidence > 0.0
            else ""
        )

        return (
            f"The model recommends {outcome_label}, with a leading "
            f"probability of {probability_text}.{xg_text}"
            f"{confidence_text} The assessed risk level is {risk_level}."
        )

    def _first_number(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> float:
        for key in keys:
            if key in source:
                number = self._to_float(source[key])

                if number is not None:
                    return number

        return 0.0

    def _normalise_probability(self, value: float) -> float:
        if value > 1.0 and value <= 100.0:
            value /= 100.0

        return round(min(max(value, 0.0), 1.0), 6)

    def _to_float(self, value: Any) -> float | None:
        if value is None or isinstance(value, bool):
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

