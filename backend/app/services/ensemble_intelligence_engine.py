from __future__ import annotations

from math import exp
from typing import Any


class EnsembleIntelligenceEngine:
    """
    Combines several independent football-analysis signals.

    The engine does not replace Poisson or Prediction V6.
    It uses Poisson as the statistical baseline, then blends it with
    xG, team strength, form and Elo signals when available.
    """

    MODEL_VERSION = "Ensemble Intelligence Engine V1.0"

    DEFAULT_WEIGHTS = {
        "poisson": 0.50,
        "expected_goals": 0.20,
        "team_strength": 0.12,
        "form": 0.10,
        "elo": 0.08,
    }

    OUTCOMES = ("home_win", "draw", "away_win")

    def combine(
        self,
        prediction: dict[str, Any],
        features: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        features = features or {}

        experts: dict[str, dict[str, float]] = {}
        unavailable_experts: list[str] = []

        poisson = self._extract_poisson_probabilities(prediction)

        if self._is_valid_distribution(poisson):
            experts["poisson"] = poisson
        else:
            unavailable_experts.append("poisson")

        expected_goals = self._extract_expected_goals(
            prediction=prediction,
            features=features,
        )

        if expected_goals is not None:
            experts["expected_goals"] = self._xg_probabilities(
                home_xg=expected_goals["home"],
                away_xg=expected_goals["away"],
            )
        else:
            unavailable_experts.append("expected_goals")

        strength = self._extract_pair(
            features,
            home_keys=["home_team_strength", "home_strength"],
            away_keys=["away_team_strength", "away_strength"],
        )

        if strength is not None:
            experts["team_strength"] = self._signal_probabilities(
                home_value=strength[0],
                away_value=strength[1],
                draw_base=0.27,
                sensitivity=1.10,
            )
        else:
            unavailable_experts.append("team_strength")

        form = self._extract_pair(
            features,
            home_keys=["home_form", "home_form_score"],
            away_keys=["away_form", "away_form_score"],
        )

        if form is not None:
            experts["form"] = self._signal_probabilities(
                home_value=form[0],
                away_value=form[1],
                draw_base=0.28,
                sensitivity=1.25,
            )
        else:
            unavailable_experts.append("form")

        elo = self._extract_pair(
            features,
            home_keys=["home_elo", "home_elo_rating"],
            away_keys=["away_elo", "away_elo_rating"],
        )

        if elo is not None:
            experts["elo"] = self._elo_probabilities(
                home_elo=elo[0],
                away_elo=elo[1],
            )
        else:
            unavailable_experts.append("elo")

        if not experts:
            return self._empty_result(
                unavailable_experts=unavailable_experts,
            )

        active_weights = self._normalise_active_weights(experts)

        combined = {
            outcome: sum(
                experts[expert][outcome] * active_weights[expert]
                for expert in experts
            )
            for outcome in self.OUTCOMES
        }

        combined = self._normalise_distribution(combined)

        ordered = sorted(
            combined.items(),
            key=lambda item: item[1],
            reverse=True,
        )

        recommended_outcome = ordered[0][0]
        primary_probability = ordered[0][1]
        second_probability = ordered[1][1]
        probability_margin = primary_probability - second_probability

        agreement = self._calculate_agreement(
            experts=experts,
            recommended_outcome=recommended_outcome,
        )

        stability = self._calculate_stability(
            experts=experts,
            combined=combined,
        )

        confidence_modifier = round(
            (agreement * 0.60) + (stability * 0.40),
            4,
        )

        return {
            "model": self.MODEL_VERSION,
            "status": "success",
            "recommended_outcome": recommended_outcome,
            "probabilities": {
                key: round(value * 100.0, 2)
                for key, value in combined.items()
            },
            "probabilities_normalised": {
                key: round(value, 6)
                for key, value in combined.items()
            },
            "primary_probability": round(
                primary_probability * 100.0,
                2,
            ),
            "second_probability": round(
                second_probability * 100.0,
                2,
            ),
            "probability_margin": round(
                probability_margin * 100.0,
                2,
            ),
            "agreement": {
                "score": round(agreement * 100.0, 2),
                "level": self._agreement_level(agreement),
            },
            "stability": {
                "score": round(stability * 100.0, 2),
                "level": self._stability_level(stability),
            },
            "confidence_modifier": round(
                confidence_modifier * 100.0,
                2,
            ),
            "weights": {
                key: round(value, 4)
                for key, value in active_weights.items()
            },
            "experts": {
                name: {
                    key: round(value * 100.0, 2)
                    for key, value in probabilities.items()
                }
                for name, probabilities in experts.items()
            },
            "available_experts": list(experts.keys()),
            "unavailable_experts": unavailable_experts,
            "expert_count": len(experts),
        }

    def _extract_poisson_probabilities(
        self,
        prediction: dict[str, Any],
    ) -> dict[str, float]:
        candidates: list[Any] = []

        markets = prediction.get("markets")
        if isinstance(markets, dict):
            candidates.append(markets.get("match_result"))

        poisson = prediction.get("poisson")
        if isinstance(poisson, dict):
            candidates.append(poisson.get("match_result"))

        candidates.append(prediction.get("probabilities"))

        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue

            probabilities = {
                "home_win": self._probability(
                    candidate.get(
                        "home_win",
                        candidate.get("home"),
                    )
                ),
                "draw": self._probability(
                    candidate.get(
                        "draw",
                        candidate.get("x"),
                    )
                ),
                "away_win": self._probability(
                    candidate.get(
                        "away_win",
                        candidate.get("away"),
                    )
                ),
            }

            if self._is_valid_distribution(probabilities):
                return self._normalise_distribution(probabilities)

        return {
            "home_win": 0.0,
            "draw": 0.0,
            "away_win": 0.0,
        }

    def _extract_expected_goals(
        self,
        prediction: dict[str, Any],
        features: dict[str, Any],
    ) -> dict[str, float] | None:
        sources: list[Any] = []

        decision = prediction.get("decision")
        if isinstance(decision, dict):
            sources.append(decision.get("expected_goals"))

        analysis = prediction.get("analysis")
        if isinstance(analysis, dict):
            ai_decision = analysis.get("ai_decision")
            if isinstance(ai_decision, dict):
                sources.append(ai_decision.get("expected_goals"))

        sources.append(prediction.get("expected_goals"))

        poisson = prediction.get("poisson")
        if isinstance(poisson, dict):
            sources.append(poisson.get("input"))

        sources.append(features)

        for source in sources:
            if not isinstance(source, dict):
                continue

            home = self._first_number(
                source,
                [
                    "home",
                    "home_xg",
                    "home_expected_goals",
                    "expected_home_goals",
                ],
            )
            away = self._first_number(
                source,
                [
                    "away",
                    "away_xg",
                    "away_expected_goals",
                    "expected_away_goals",
                ],
            )

            if home is not None and away is not None:
                if home >= 0.0 and away >= 0.0:
                    return {
                        "home": home,
                        "away": away,
                    }

        return None

    def _xg_probabilities(
        self,
        home_xg: float,
        away_xg: float,
    ) -> dict[str, float]:
        difference = home_xg - away_xg
        total = home_xg + away_xg

        draw_base = 0.30

        if total < 1.8:
            draw_base += 0.05
        elif total > 3.2:
            draw_base -= 0.04

        draw_probability = draw_base * exp(
            -abs(difference) * 0.75
        )
        draw_probability = min(
            max(draw_probability, 0.16),
            0.38,
        )

        remaining = 1.0 - draw_probability
        home_share = self._sigmoid(difference * 1.25)

        return self._normalise_distribution(
            {
                "home_win": remaining * home_share,
                "draw": draw_probability,
                "away_win": remaining * (1.0 - home_share),
            }
        )

    def _signal_probabilities(
        self,
        home_value: float,
        away_value: float,
        draw_base: float,
        sensitivity: float,
    ) -> dict[str, float]:
        scale = max(
            abs(home_value),
            abs(away_value),
            1.0,
        )
        difference = (home_value - away_value) / scale

        draw_probability = draw_base * exp(
            -abs(difference) * 1.5
        )
        draw_probability = min(
            max(draw_probability, 0.17),
            0.36,
        )

        remaining = 1.0 - draw_probability
        home_share = self._sigmoid(
            difference * sensitivity * 2.0
        )

        return self._normalise_distribution(
            {
                "home_win": remaining * home_share,
                "draw": draw_probability,
                "away_win": remaining * (1.0 - home_share),
            }
        )

    def _elo_probabilities(
        self,
        home_elo: float,
        away_elo: float,
    ) -> dict[str, float]:
        difference = home_elo - away_elo
        home_share = 1.0 / (
            1.0 + 10.0 ** (-difference / 400.0)
        )

        draw_probability = 0.28 * exp(
            -abs(difference) / 450.0
        )
        draw_probability = min(
            max(draw_probability, 0.16),
            0.30,
        )

        remaining = 1.0 - draw_probability

        return self._normalise_distribution(
            {
                "home_win": remaining * home_share,
                "draw": draw_probability,
                "away_win": remaining * (1.0 - home_share),
            }
        )

    def _normalise_active_weights(
        self,
        experts: dict[str, dict[str, float]],
    ) -> dict[str, float]:
        total = sum(
            self.DEFAULT_WEIGHTS.get(name, 0.0)
            for name in experts
        )

        if total <= 0.0:
            equal_weight = 1.0 / len(experts)
            return {
                name: equal_weight
                for name in experts
            }

        return {
            name: self.DEFAULT_WEIGHTS.get(name, 0.0) / total
            for name in experts
        }

    def _calculate_agreement(
        self,
        experts: dict[str, dict[str, float]],
        recommended_outcome: str,
    ) -> float:
        agreeing_experts = sum(
            1
            for probabilities in experts.values()
            if max(
                probabilities,
                key=probabilities.get,
            ) == recommended_outcome
        )

        return agreeing_experts / len(experts)

    def _calculate_stability(
        self,
        experts: dict[str, dict[str, float]],
        combined: dict[str, float],
    ) -> float:
        deviations: list[float] = []

        for probabilities in experts.values():
            deviation = sum(
                abs(
                    probabilities[outcome]
                    - combined[outcome]
                )
                for outcome in self.OUTCOMES
            ) / len(self.OUTCOMES)

            deviations.append(deviation)

        average_deviation = (
            sum(deviations) / len(deviations)
            if deviations
            else 1.0
        )

        return min(
            max(1.0 - (average_deviation * 2.5), 0.0),
            1.0,
        )

    def _extract_pair(
        self,
        source: dict[str, Any],
        home_keys: list[str],
        away_keys: list[str],
    ) -> tuple[float, float] | None:
        home = self._first_number(source, home_keys)
        away = self._first_number(source, away_keys)

        if home is None or away is None:
            return None

        return home, away

    def _first_number(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> float | None:
        for key in keys:
            if key not in source:
                continue

            number = self._to_float(source[key])

            if number is not None:
                return number

        return None

    def _probability(self, value: Any) -> float:
        number = self._to_float(value)

        if number is None:
            return 0.0

        if 1.0 < number <= 100.0:
            number /= 100.0

        return min(max(number, 0.0), 1.0)

    def _normalise_distribution(
        self,
        probabilities: dict[str, float],
    ) -> dict[str, float]:
        total = sum(
            max(probabilities.get(outcome, 0.0), 0.0)
            for outcome in self.OUTCOMES
        )

        if total <= 0.0:
            return {
                "home_win": 1.0 / 3.0,
                "draw": 1.0 / 3.0,
                "away_win": 1.0 / 3.0,
            }

        return {
            outcome: max(
                probabilities.get(outcome, 0.0),
                0.0,
            ) / total
            for outcome in self.OUTCOMES
        }

    def _is_valid_distribution(
        self,
        probabilities: dict[str, float],
    ) -> bool:
        return (
            all(
                outcome in probabilities
                for outcome in self.OUTCOMES
            )
            and sum(probabilities.values()) > 0.0
        )

    def _sigmoid(self, value: float) -> float:
        if value >= 0.0:
            factor = exp(-value)
            return 1.0 / (1.0 + factor)

        factor = exp(value)
        return factor / (1.0 + factor)

    def _agreement_level(self, agreement: float) -> str:
        if agreement >= 0.80:
            return "very_high"
        if agreement >= 0.60:
            return "high"
        if agreement >= 0.40:
            return "medium"
        return "low"

    def _stability_level(self, stability: float) -> str:
        if stability >= 0.80:
            return "very_high"
        if stability >= 0.65:
            return "high"
        if stability >= 0.45:
            return "medium"
        return "low"

    def _empty_result(
        self,
        unavailable_experts: list[str],
    ) -> dict[str, Any]:
        return {
            "model": self.MODEL_VERSION,
            "status": "insufficient_data",
            "recommended_outcome": "uncertain",
            "probabilities": {
                "home_win": 33.33,
                "draw": 33.33,
                "away_win": 33.33,
            },
            "probabilities_normalised": {
                "home_win": 0.333333,
                "draw": 0.333333,
                "away_win": 0.333333,
            },
            "primary_probability": 33.33,
            "second_probability": 33.33,
            "probability_margin": 0.0,
            "agreement": {
                "score": 0.0,
                "level": "low",
            },
            "stability": {
                "score": 0.0,
                "level": "low",
            },
            "confidence_modifier": 0.0,
            "weights": {},
            "experts": {},
            "available_experts": [],
            "unavailable_experts": unavailable_experts,
            "expert_count": 0,
        }

    def _to_float(self, value: Any) -> float | None:
        if value is None or isinstance(value, bool):
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None
