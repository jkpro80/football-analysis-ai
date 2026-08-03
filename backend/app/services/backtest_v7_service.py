from __future__ import annotations

import math
from collections import defaultdict
from time import perf_counter
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Match
from app.services.match_analysis_pipeline import MatchAnalysisPipeline


class BacktestV7Service:
    """
    يشغّل Prediction V7 على مباريات منتهية ويقارن التوقعات بالنتائج الفعلية.

    المبادئ:
    - يستخدم MatchAnalysisPipeline نفسه المستخدم في الإنتاج.
    - لا يحفظ Features أو Predictions أثناء الاختبار.
    - لا يغيّر منطق Prediction V6 أو Prediction V7.
    - يعزل فشل أي مباراة عن بقية عينة الاختبار.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.pipeline = MatchAnalysisPipeline(db=db)

    def run(
        self,
        limit: int = 100,
        history_limit: int = 5,
        max_goals: int | None = None,
        top_scores_count: int | None = None,
        include_details: bool = True,
    ) -> dict[str, Any]:
        safe_limit = self._bounded_integer(
            value=limit,
            minimum=1,
            maximum=1000,
            field_name="limit",
        )
        safe_history_limit = self._bounded_integer(
            value=history_limit,
            minimum=1,
            maximum=20,
            field_name="history_limit",
        )

        started_at = perf_counter()
        matches = self._get_finished_matches(limit=safe_limit)

        counters = {
            "processed": 0,
            "failed": 0,
            "result_correct": 0,
            "btts_correct": 0,
            "over_2_5_correct": 0,
            "double_chance_correct": 0,
            "exact_score_correct": 0,
        }

        errors = {
            "home_absolute": 0.0,
            "away_absolute": 0.0,
            "total_absolute": 0.0,
            "home_squared": 0.0,
            "away_squared": 0.0,
            "total_squared": 0.0,
        }

        probability_metrics = {
            "brier_sum": 0.0,
            "log_loss_sum": 0.0,
        }

        confidence_groups: dict[str, dict[str, int]] = defaultdict(
            lambda: {"total": 0, "correct": 0}
        )

        details: list[dict[str, Any]] = []
        failures: list[dict[str, Any]] = []

        for match in matches:
            match_started_at = perf_counter()

            try:
                prediction = self.pipeline.analyze_match(
                    match_id=int(match.id),
                    history_limit=safe_history_limit,
                    max_goals=max_goals,
                    top_scores_count=top_scores_count,
                    save_features=False,
                    save_prediction=False,
                )

                evaluation = self._evaluate_match(
                    match=match,
                    prediction=prediction,
                )

                counters["processed"] += 1
                counters["result_correct"] += int(
                    evaluation["correct"]["result"]
                )
                counters["btts_correct"] += int(
                    evaluation["correct"]["btts"]
                )
                counters["over_2_5_correct"] += int(
                    evaluation["correct"]["over_2_5"]
                )
                counters["double_chance_correct"] += int(
                    evaluation["correct"]["double_chance"]
                )
                counters["exact_score_correct"] += int(
                    evaluation["correct"]["exact_score"]
                )

                goal_errors = evaluation["goal_errors"]

                errors["home_absolute"] += goal_errors["home_absolute"]
                errors["away_absolute"] += goal_errors["away_absolute"]
                errors["total_absolute"] += goal_errors["total_absolute"]

                errors["home_squared"] += goal_errors["home_squared"]
                errors["away_squared"] += goal_errors["away_squared"]
                errors["total_squared"] += goal_errors["total_squared"]

                probability_metrics["brier_sum"] += evaluation[
                    "probability_metrics"
                ]["brier_score"]

                probability_metrics["log_loss_sum"] += evaluation[
                    "probability_metrics"
                ]["log_loss"]

                confidence_level = evaluation["confidence"]["level"]
                confidence_groups[confidence_level]["total"] += 1
                confidence_groups[confidence_level]["correct"] += int(
                    evaluation["correct"]["result"]
                )

                if include_details:
                    evaluation["execution_time_ms"] = round(
                        (perf_counter() - match_started_at) * 1000.0,
                        3,
                    )
                    details.append(evaluation)

            except Exception as exc:
                self.db.rollback()
                counters["failed"] += 1

                failures.append(
                    {
                        "match_id": int(match.id),
                        "date": getattr(match, "date", None),
                        "error_type": type(exc).__name__,
                        "error": str(exc),
                    }
                )

        processed = counters["processed"]
        elapsed_ms = round(
            (perf_counter() - started_at) * 1000.0,
            3,
        )

        if processed == 0:
            return {
                "status": "error",
                "model": "Prediction V7",
                "message": "No matches were successfully backtested.",
                "settings": {
                    "requested_limit": safe_limit,
                    "history_limit": safe_history_limit,
                    "max_goals": max_goals,
                    "top_scores_count": top_scores_count,
                },
                "sample": {
                    "finished_matches_found": len(matches),
                    "matches_tested": 0,
                    "failed": counters["failed"],
                },
                "execution_time_ms": elapsed_ms,
                "failures": failures,
            }

        metrics = {
            "accuracy": {
                "1x2": self._percentage(
                    counters["result_correct"],
                    processed,
                ),
                "btts": self._percentage(
                    counters["btts_correct"],
                    processed,
                ),
                "over_2_5": self._percentage(
                    counters["over_2_5_correct"],
                    processed,
                ),
                "double_chance": self._percentage(
                    counters["double_chance_correct"],
                    processed,
                ),
                "exact_score": self._percentage(
                    counters["exact_score_correct"],
                    processed,
                ),
            },
            "mae": {
                "home_goals": self._average(
                    errors["home_absolute"],
                    processed,
                ),
                "away_goals": self._average(
                    errors["away_absolute"],
                    processed,
                ),
                "total_goals": self._average(
                    errors["total_absolute"],
                    processed,
                ),
            },
            "rmse": {
                "home_goals": self._root_mean_square(
                    errors["home_squared"],
                    processed,
                ),
                "away_goals": self._root_mean_square(
                    errors["away_squared"],
                    processed,
                ),
                "total_goals": self._root_mean_square(
                    errors["total_squared"],
                    processed,
                ),
            },
            "probability_quality": {
                "brier_score": self._average(
                    probability_metrics["brier_sum"],
                    processed,
                    digits=5,
                ),
                "log_loss": self._average(
                    probability_metrics["log_loss_sum"],
                    processed,
                    digits=5,
                ),
            },
            "confidence_accuracy": self._confidence_report(
                confidence_groups
            ),
        }

        ranked_details = sorted(
            details,
            key=lambda item: item["ranking_score"],
            reverse=True,
        )

        return {
            "status": "success",
            "model": "Prediction V7",
            "settings": {
                "requested_limit": safe_limit,
                "history_limit": safe_history_limit,
                "max_goals": max_goals,
                "top_scores_count": top_scores_count,
                "include_details": include_details,
            },
            "sample": {
                "finished_matches_found": len(matches),
                "matches_tested": processed,
                "failed": counters["failed"],
            },
            "metrics": metrics,
            "best_predictions": ranked_details[:5],
            "worst_predictions": list(reversed(ranked_details[-5:])),
            "execution_time_ms": elapsed_ms,
            "details": details if include_details else [],
            "failures": failures,
        }

    def _evaluate_match(
        self,
        match: Match,
        prediction: dict[str, Any],
    ) -> dict[str, Any]:
        actual_home = int(match.home_score)
        actual_away = int(match.away_score)
        actual_total = actual_home + actual_away
        actual_result = self._actual_result(
            home_score=actual_home,
            away_score=actual_away,
        )
        actual_btts = actual_home > 0 and actual_away > 0
        actual_over_2_5 = actual_total > 2.5
        actual_score = f"{actual_home}-{actual_away}"

        prediction_section = self._mapping(
            prediction.get("prediction")
        )
        markets = self._mapping(prediction.get("markets"))

        result_probabilities = self._result_probabilities(
            self._mapping(markets.get("match_result"))
        )
        predicted_result = max(
            result_probabilities,
            key=result_probabilities.get,
        )

        btts_market = self._mapping(markets.get("btts"))
        predicted_btts, btts_probabilities = self._binary_pick(
            market=btts_market,
            positive_keys=("yes", "btts_yes", "both_teams_to_score"),
            negative_keys=("no", "btts_no"),
        )

        totals_market = self._mapping(markets.get("totals"))
        over_2_5_market = self._extract_over_2_5_market(totals_market)
        predicted_over_2_5, totals_probabilities = self._binary_pick(
            market=over_2_5_market,
            positive_keys=("over", "over_2_5"),
            negative_keys=("under", "under_2_5"),
        )

        double_chance_market = self._mapping(
            markets.get("double_chance")
        )
        double_chance_pick = self._highest_probability_key(
            double_chance_market
        )
        double_chance_correct = self._double_chance_is_correct(
            pick=double_chance_pick,
            actual_result=actual_result,
        )

        predicted_score = self._predicted_score(
            prediction_section.get("most_likely_score")
        )

        expected_goals = self._mapping(
            prediction_section.get("expected_goals")
        )
        home_xg = self._first_number(
            expected_goals,
            (
                "home_expected_goals",
                "home",
                "home_xg",
            ),
        )
        away_xg = self._first_number(
            expected_goals,
            (
                "away_expected_goals",
                "away",
                "away_xg",
            ),
        )
        total_xg = self._first_number(
            expected_goals,
            (
                "total_expected_goals",
                "total",
                "total_xg",
            ),
            default=home_xg + away_xg,
        )

        confidence = self._mapping(
            prediction_section.get("confidence")
        )
        confidence_value = self._probability(
            confidence.get("value")
        )
        confidence_level = str(
            confidence.get("level") or "unknown"
        ).lower()

        result_correct = predicted_result == actual_result
        btts_correct = predicted_btts == actual_btts
        over_2_5_correct = (
            predicted_over_2_5 == actual_over_2_5
        )
        exact_score_correct = predicted_score == actual_score

        brier_score = self._multiclass_brier_score(
            probabilities=result_probabilities,
            actual_result=actual_result,
        )
        log_loss = self._multiclass_log_loss(
            probabilities=result_probabilities,
            actual_result=actual_result,
        )

        result_probability = result_probabilities[predicted_result]
        ranking_score = round(
            (1.0 if result_correct else 0.0)
            + (1.0 if btts_correct else 0.0)
            + (1.0 if over_2_5_correct else 0.0)
            + (1.0 if exact_score_correct else 0.0)
            + result_probability,
            5,
        )

        return {
            "match_id": int(match.id),
            "date": getattr(match, "date", None),
            "actual": {
                "home_goals": actual_home,
                "away_goals": actual_away,
                "total_goals": actual_total,
                "score": actual_score,
                "result": actual_result,
                "btts": actual_btts,
                "over_2_5": actual_over_2_5,
            },
            "predicted": {
                "result": predicted_result,
                "result_probabilities": result_probabilities,
                "score": predicted_score,
                "expected_goals": {
                    "home": round(home_xg, 4),
                    "away": round(away_xg, 4),
                    "total": round(total_xg, 4),
                },
                "btts": predicted_btts,
                "btts_probabilities": btts_probabilities,
                "over_2_5": predicted_over_2_5,
                "totals_probabilities": totals_probabilities,
                "double_chance": double_chance_pick,
            },
            "correct": {
                "result": result_correct,
                "btts": btts_correct,
                "over_2_5": over_2_5_correct,
                "double_chance": double_chance_correct,
                "exact_score": exact_score_correct,
            },
            "confidence": {
                "value": confidence_value,
                "level": confidence_level,
            },
            "goal_errors": {
                "home_absolute": abs(home_xg - actual_home),
                "away_absolute": abs(away_xg - actual_away),
                "total_absolute": abs(total_xg - actual_total),
                "home_squared": (home_xg - actual_home) ** 2,
                "away_squared": (away_xg - actual_away) ** 2,
                "total_squared": (total_xg - actual_total) ** 2,
            },
            "probability_metrics": {
                "brier_score": round(brier_score, 6),
                "log_loss": round(log_loss, 6),
            },
            "ranking_score": ranking_score,
            "model": prediction.get("model"),
        }

    def _get_finished_matches(self, limit: int) -> list[Match]:
        statement = (
            select(Match)
            .where(
                Match.status == "5",
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(Match.date.desc(), Match.id.desc())
            .limit(limit)
        )

        return list(self.db.scalars(statement).all())

    @staticmethod
    def _actual_result(
        home_score: int,
        away_score: int,
    ) -> str:
        if home_score > away_score:
            return "home_win"
        if home_score < away_score:
            return "away_win"
        return "draw"

    @classmethod
    def _result_probabilities(
        cls,
        market: dict[str, Any],
    ) -> dict[str, float]:
        probabilities = {
            "home_win": cls._probability(
                market.get("home_win")
            ),
            "draw": cls._probability(
                market.get("draw")
            ),
            "away_win": cls._probability(
                market.get("away_win")
            ),
        }

        total = sum(probabilities.values())

        if total <= 0.0:
            raise ValueError(
                "سوق match_result لا يحتوي على احتمالات صالحة."
            )

        return {
            key: value / total
            for key, value in probabilities.items()
        }

    @classmethod
    def _binary_pick(
        cls,
        market: dict[str, Any],
        positive_keys: tuple[str, ...],
        negative_keys: tuple[str, ...],
    ) -> tuple[bool, dict[str, float]]:
        positive = cls._first_number(
            market,
            positive_keys,
        )
        negative = cls._first_number(
            market,
            negative_keys,
        )

        total = positive + negative

        if total <= 0.0:
            raise ValueError(
                "السوق الثنائي لا يحتوي على احتمالات صالحة."
            )

        positive_probability = positive / total
        negative_probability = negative / total

        return (
            positive_probability >= negative_probability,
            {
                "yes": round(positive_probability, 6),
                "no": round(negative_probability, 6),
            },
        )

    @classmethod
    def _extract_over_2_5_market(
        cls,
        totals: dict[str, Any],
    ) -> dict[str, Any]:
        direct = totals.get("2.5")

        if isinstance(direct, dict):
            return direct

        direct = totals.get("2_5")

        if isinstance(direct, dict):
            return direct

        direct = totals.get("over_under_2_5")

        if isinstance(direct, dict):
            return direct

        return {
            "over": totals.get("over_2_5"),
            "under": totals.get("under_2_5"),
        }

    @classmethod
    def _predicted_score(cls, value: Any) -> str:
        if isinstance(value, str):
            normalized = value.strip().replace(":", "-")
            return normalized

        if isinstance(value, dict):
            home = cls._first_number(
                value,
                ("home", "home_goals"),
            )
            away = cls._first_number(
                value,
                ("away", "away_goals"),
            )
            return f"{int(round(home))}-{int(round(away))}"

        if isinstance(value, (list, tuple)) and len(value) >= 2:
            return f"{int(value[0])}-{int(value[1])}"

        return "not_available"

    @classmethod
    def _highest_probability_key(
        cls,
        market: dict[str, Any],
    ) -> str:
        if not market:
            return "not_available"

        values = {
            str(key): cls._probability(value)
            for key, value in market.items()
            if isinstance(value, (int, float, str))
        }

        if not values:
            return "not_available"

        return max(values, key=values.get)

    @staticmethod
    def _double_chance_is_correct(
        pick: str,
        actual_result: str,
    ) -> bool:
        allowed_results = {
            "home_or_draw": {"home_win", "draw"},
            "1x": {"home_win", "draw"},
            "away_or_draw": {"away_win", "draw"},
            "x2": {"away_win", "draw"},
            "home_or_away": {"home_win", "away_win"},
            "12": {"home_win", "away_win"},
        }

        normalized_pick = pick.strip().lower()

        return actual_result in allowed_results.get(
            normalized_pick,
            set(),
        )

    @classmethod
    def _multiclass_brier_score(
        cls,
        probabilities: dict[str, float],
        actual_result: str,
    ) -> float:
        return sum(
            (
                probability
                - (1.0 if outcome == actual_result else 0.0)
            )
            ** 2
            for outcome, probability in probabilities.items()
        ) / len(probabilities)

    @staticmethod
    def _multiclass_log_loss(
        probabilities: dict[str, float],
        actual_result: str,
    ) -> float:
        epsilon = 1e-15
        probability = probabilities.get(actual_result, 0.0)
        probability = min(max(probability, epsilon), 1.0 - epsilon)
        return -math.log(probability)

    @staticmethod
    def _confidence_report(
        groups: dict[str, dict[str, int]],
    ) -> dict[str, dict[str, Any]]:
        report: dict[str, dict[str, Any]] = {}

        for level, values in sorted(groups.items()):
            total = values["total"]
            correct = values["correct"]

            report[level] = {
                "matches": total,
                "correct": correct,
                "accuracy": (
                    round((correct / total) * 100.0, 2)
                    if total > 0
                    else 0.0
                ),
            }

        return report

    @staticmethod
    def _mapping(value: Any) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

    @classmethod
    def _first_number(
        cls,
        values: dict[str, Any],
        keys: tuple[str, ...],
        default: float = 0.0,
    ) -> float:
        for key in keys:
            if key in values and values[key] is not None:
                return cls._number(values[key], default=default)

        return float(default)

    @staticmethod
    def _number(
        value: Any,
        default: float = 0.0,
    ) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    @classmethod
    def _probability(cls, value: Any) -> float:
        number = cls._number(value)

        if number > 1.0:
            number /= 100.0

        return min(max(number, 0.0), 1.0)

    @staticmethod
    def _bounded_integer(
        value: Any,
        minimum: int,
        maximum: int,
        field_name: str,
    ) -> int:
        try:
            number = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} يجب أن يكون عددًا صحيحًا."
            ) from exc

        return max(minimum, min(number, maximum))

    @staticmethod
    def _percentage(
        correct: int,
        total: int,
    ) -> float:
        return round((correct / total) * 100.0, 2)

    @staticmethod
    def _average(
        total_value: float,
        total: int,
        digits: int = 3,
    ) -> float:
        return round(total_value / total, digits)

    @staticmethod
    def _root_mean_square(
        squared_error: float,
        total: int,
    ) -> float:
        return round(math.sqrt(squared_error / total), 3)

