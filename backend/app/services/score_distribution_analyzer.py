from __future__ import annotations

from math import log
from typing import Any


class ScoreDistributionAnalyzer:
    """
    Analyzes a Poisson score distribution without changing
    the underlying probabilities.

    The analyzer is intended for:
    - Confidence Engine V1.1
    - Correct Score V1.1
    - Score Matrix heat maps
    - Backtesting diagnostics
    """

    MODEL_VERSION = "Score Distribution Analyzer V1.0"

    @classmethod
    def analyze(
        cls,
        score_matrix: list[list[float]],
        *,
        predicted_outcome: str | None = None,
        top_limit: int = 10,
    ) -> dict[str, Any]:
        cls._validate_matrix(score_matrix)

        cells = cls._flatten_matrix(score_matrix)

        if not cells:
            raise ValueError(
                "score_matrix does not contain any probabilities."
            )

        total_probability = sum(
            cell["probability"]
            for cell in cells
        )

        if total_probability <= 0:
            raise ValueError(
                "score_matrix total probability must be positive."
            )

        normalized_cells = [
            {
                **cell,
                "probability": (
                    cell["probability"] / total_probability
                ),
            }
            for cell in cells
        ]

        ranked = sorted(
            normalized_cells,
            key=lambda item: item["probability"],
            reverse=True,
        )

        entropy = cls._entropy(
            probabilities=[
                item["probability"]
                for item in ranked
            ]
        )

        maximum_entropy = log(len(ranked))

        normalized_entropy = (
            entropy / maximum_entropy
            if maximum_entropy > 0
            else 0.0
        )

        outcome_totals = cls._outcome_totals(
            normalized_cells
        )

        dominant_outcome = max(
            outcome_totals,
            key=outcome_totals.get,
        )

        most_likely_score = ranked[0]

        second_probability = (
            ranked[1]["probability"]
            if len(ranked) > 1
            else 0.0
        )

        score_margin = (
            most_likely_score["probability"]
            - second_probability
        )

        recommended_score = cls._recommended_score(
            ranked=ranked,
            predicted_outcome=predicted_outcome,
        )

        outcome_consistency = cls._outcome_consistency(
            dominant_outcome=dominant_outcome,
            predicted_outcome=predicted_outcome,
            most_likely_score=most_likely_score,
        )

        return {
            "model": cls.MODEL_VERSION,
            "matrix_size": {
                "home_scores": len(
                    {
                        item["home_goals"]
                        for item in normalized_cells
                    }
                ),
                "away_scores": len(
                    {
                        item["away_goals"]
                        for item in normalized_cells
                    }
                ),
                "cells": len(normalized_cells),
            },
            "total_probability": round(
                total_probability,
                8,
            ),
            "entropy": round(
                entropy,
                6,
            ),
            "normalized_entropy": round(
                normalized_entropy,
                6,
            ),
            "concentration": {
                "top_1": cls._percentage(
                    sum(
                        item["probability"]
                        for item in ranked[:1]
                    )
                ),
                "top_3": cls._percentage(
                    sum(
                        item["probability"]
                        for item in ranked[:3]
                    )
                ),
                "top_5": cls._percentage(
                    sum(
                        item["probability"]
                        for item in ranked[:5]
                    )
                ),
            },
            "score_margin": cls._percentage(
                score_margin
            ),
            "outcome_probabilities": {
                key: cls._percentage(value)
                for key, value in outcome_totals.items()
            },
            "dominant_outcome": dominant_outcome,
            "predicted_outcome": predicted_outcome,
            "outcome_consistency": outcome_consistency,
            "most_likely_score": (
                cls._serialize_score(
                    most_likely_score
                )
            ),
            "recommended_score": (
                cls._serialize_score(
                    recommended_score
                )
            ),
            "top_scores": [
                cls._serialize_score(item)
                for item in ranked[:max(1, top_limit)]
            ],
        }

    @classmethod
    def _flatten_matrix(
        cls,
        score_matrix: list[Any],
    ) -> list[dict[str, Any]]:
        cells: list[dict[str, Any]] = []

        if score_matrix and isinstance(
            score_matrix[0],
            dict,
        ):
            for item in score_matrix:
                if not isinstance(item, dict):
                    raise ValueError(
                        "Serialized score_matrix items must be dictionaries."
                    )

                home_goals = int(
                    item.get("home_goals", 0)
                )
                away_goals = int(
                    item.get("away_goals", 0)
                )

                number = float(
                    item.get("probability", 0.0)
                )

                if number < 0:
                    raise ValueError(
                        "score_matrix cannot contain negative probabilities."
                    )

                # Serialized Poisson probabilities are percentages.
                # Keep them as positive weights because analyze()
                # normalizes the complete distribution afterward.
                cells.append(
                    {
                        "home_goals": home_goals,
                        "away_goals": away_goals,
                        "score": (
                            f"{home_goals}-{away_goals}"
                        ),
                        "probability": number,
                        "outcome": cls._score_outcome(
                            home_goals=home_goals,
                            away_goals=away_goals,
                        ),
                    }
                )

            return cells

        for home_goals, row in enumerate(
            score_matrix
        ):
            if not isinstance(row, list):
                raise ValueError(
                    "Raw score_matrix rows must be lists."
                )

            for away_goals, probability in enumerate(
                row
            ):
                number = float(probability)

                if number < 0:
                    raise ValueError(
                        "score_matrix cannot contain negative probabilities."
                    )

                cells.append(
                    {
                        "home_goals": home_goals,
                        "away_goals": away_goals,
                        "score": (
                            f"{home_goals}-{away_goals}"
                        ),
                        "probability": number,
                        "outcome": cls._score_outcome(
                            home_goals=home_goals,
                            away_goals=away_goals,
                        ),
                    }
                )

        return cells

    @staticmethod
    def _entropy(
        probabilities: list[float],
    ) -> float:
        return -sum(
            probability * log(probability)
            for probability in probabilities
            if probability > 0
        )

    @classmethod
    def _outcome_totals(
        cls,
        cells: list[dict[str, Any]],
    ) -> dict[str, float]:
        totals = {
            "home_win": 0.0,
            "draw": 0.0,
            "away_win": 0.0,
        }

        for cell in cells:
            totals[cell["outcome"]] += (
                cell["probability"]
            )

        return totals

    @classmethod
    def _recommended_score(
        cls,
        *,
        ranked: list[dict[str, Any]],
        predicted_outcome: str | None,
    ) -> dict[str, Any]:
        if predicted_outcome not in {
            "home_win",
            "draw",
            "away_win",
        }:
            return ranked[0]

        for item in ranked:
            if item["outcome"] == predicted_outcome:
                return item

        return ranked[0]

    @classmethod
    def _outcome_consistency(
        cls,
        *,
        dominant_outcome: str,
        predicted_outcome: str | None,
        most_likely_score: dict[str, Any],
    ) -> dict[str, Any]:
        score_outcome = most_likely_score["outcome"]

        return {
            "dominant_matches_prediction": (
                predicted_outcome is None
                or dominant_outcome
                == predicted_outcome
            ),
            "top_score_matches_prediction": (
                predicted_outcome is None
                or score_outcome
                == predicted_outcome
            ),
            "top_score_outcome": score_outcome,
        }

    @staticmethod
    def _score_outcome(
        *,
        home_goals: int,
        away_goals: int,
    ) -> str:
        if home_goals > away_goals:
            return "home_win"

        if home_goals < away_goals:
            return "away_win"

        return "draw"

    @classmethod
    def _serialize_score(
        cls,
        score: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "score": score["score"],
            "home_goals": score["home_goals"],
            "away_goals": score["away_goals"],
            "outcome": score["outcome"],
            "probability": cls._percentage(
                score["probability"]
            ),
        }

    @staticmethod
    def _percentage(
        probability: float,
    ) -> float:
        return round(
            probability * 100.0,
            2,
        )

    @staticmethod
    def _validate_matrix(
        score_matrix: list[Any],
    ) -> None:
        if not isinstance(score_matrix, list):
            raise TypeError(
                "score_matrix must be a list."
            )

        if not score_matrix:
            raise ValueError(
                "score_matrix cannot be empty."
            )

        first_item = score_matrix[0]

        if isinstance(first_item, dict):
            required_keys = {
                "home_goals",
                "away_goals",
                "probability",
            }

            for item in score_matrix:
                if not isinstance(item, dict):
                    raise ValueError(
                        "Serialized score_matrix must contain dictionaries only."
                    )

                if not required_keys.issubset(item):
                    raise ValueError(
                        "Serialized score_matrix items are missing required fields."
                    )

            return

        if any(
            not isinstance(row, list)
            or not row
            for row in score_matrix
        ):
            raise ValueError(
                "Raw score_matrix rows must be non-empty lists."
            )
