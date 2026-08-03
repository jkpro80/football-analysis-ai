from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    Match,
    PredictionRecord,
)
from app.engine.prediction_engine_v31 import (
    PredictionEngineV31,
)
from app.services.prediction_evaluation_service import (
    PredictionEvaluationService,
)


class BacktestV31Service:
    """
    تشغيل Prediction Engine V3.1
    على مباريات قديمة وتقييم النتائج.
    """

    MODEL_VERSION = "Prediction Engine V3.1"

    def __init__(
        self,
        db: Session,
    ) -> None:
        self.db = db
        self.engine = PredictionEngineV31(db)

    def get_existing_record(
        self,
        match_id: int,
    ) -> PredictionRecord | None:
        statement = (
            select(PredictionRecord)
            .where(
                PredictionRecord.match_id
                == match_id,
                PredictionRecord.model_version
                == self.MODEL_VERSION,
            )
            .order_by(
                PredictionRecord.id.desc()
            )
        )

        return self.db.scalar(statement)

    def get_finished_matches(
        self,
        limit: int = 30,
        before_date: str | None = None,
        after_date: str | None = None,
    ) -> list[Match]:
        safe_limit = max(
            1,
            min(limit, 500),
        )

        statement = (
            select(Match)
            .where(
                Match.status == "finished",
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
        )

        if before_date:
            statement = statement.where(
                Match.date < before_date
            )

        if after_date:
            statement = statement.where(
                Match.date >= after_date
            )

        statement = (
            statement
            .order_by(
                Match.date.asc(),
                Match.id.asc(),
            )
            .limit(safe_limit)
        )

        return list(
            self.db.scalars(
                statement
            ).all()
        )

    def create_prediction_record(
        self,
        match: Match,
    ) -> PredictionRecord:
        prediction = self.engine.predict_match(
            match.id
        )

        record = PredictionRecord(
            match_id=match.id,
            model_version=prediction["model"],
            expected_home_goals=prediction[
                "expected_goals"
            ]["home"],
            expected_away_goals=prediction[
                "expected_goals"
            ]["away"],
            expected_total_goals=prediction[
                "expected_goals"
            ]["total"],
            home_win_probability=prediction[
                "probabilities"
            ]["home_win"],
            draw_probability=prediction[
                "probabilities"
            ]["draw"],
            away_win_probability=prediction[
                "probabilities"
            ]["away_win"],
            over_2_5_probability=prediction[
                "over_under"
            ]["over_2_5"],
            btts_probability=prediction[
                "btts"
            ]["yes"],
            predicted_score=prediction[
                "likely_scores"
            ][0]["score"],
            best_pick_key=prediction[
                "best_pick"
            ]["key"],
            best_pick_label=prediction[
                "best_pick"
            ]["label"],
            best_pick_probability=prediction[
                "best_pick"
            ]["probability"],
            confidence=prediction[
                "confidence"
            ],
            confidence_score=prediction[
                "confidence_score"
            ],
        )

        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        return record

    @staticmethod
    def get_actual_result(
        home_score: int,
        away_score: int,
    ) -> str:
        if home_score > away_score:
            return "home_win"

        if home_score < away_score:
            return "away_win"

        return "draw"

    @staticmethod
    def get_predicted_result(
        record: PredictionRecord,
    ) -> str:
        probabilities = {
            "home_win": float(
                record.home_win_probability
            ),
            "draw": float(
                record.draw_probability
            ),
            "away_win": float(
                record.away_win_probability
            ),
        }

        return max(
            probabilities,
            key=probabilities.get,
        )

    @staticmethod
    def parse_score(
        score: str | None,
    ) -> tuple[int, int] | None:
        if not score:
            return None

        parts = score.split("-")

        if len(parts) != 2:
            return None

        try:
            return (
                int(parts[0].strip()),
                int(parts[1].strip()),
            )
        except ValueError:
            return None

    def evaluate_record(
        self,
        match: Match,
        record: PredictionRecord,
    ) -> dict[str, Any]:
        actual_home = int(match.home_score)
        actual_away = int(match.away_score)
        actual_total = (
            actual_home + actual_away
        )

        actual_result = self.get_actual_result(
            actual_home,
            actual_away,
        )

        predicted_result = (
            self.get_predicted_result(
                record
            )
        )

        predicted_over_2_5 = (
            float(
                record.over_2_5_probability
            )
            >= 50.0
        )

        actual_over_2_5 = (
            actual_total > 2
        )

        predicted_btts = (
            float(
                record.btts_probability
            )
            >= 50.0
        )

        actual_btts = (
            actual_home > 0
            and actual_away > 0
        )

        parsed_score = self.parse_score(
            record.predicted_score
        )

        exact_score_correct = False

        if parsed_score is not None:
            exact_score_correct = (
                parsed_score[0]
                == actual_home
                and parsed_score[1]
                == actual_away
            )

        record.actual_home_score = actual_home
        record.actual_away_score = actual_away
        record.actual_result = actual_result
        record.result_prediction_correct = (
            predicted_result
            == actual_result
        )
        record.over_2_5_correct = (
            predicted_over_2_5
            == actual_over_2_5
        )
        record.btts_correct = (
            predicted_btts
            == actual_btts
        )
        record.exact_score_correct = (
            exact_score_correct
        )

        record.home_goals_error = round(
            abs(
                float(
                    record.expected_home_goals
                )
                - actual_home
            ),
            3,
        )

        record.away_goals_error = round(
            abs(
                float(
                    record.expected_away_goals
                )
                - actual_away
            ),
            3,
        )

        record.total_goals_error = round(
            abs(
                float(
                    record.expected_total_goals
                )
                - actual_total
            ),
            3,
        )

        record.evaluated = True

        self.db.commit()
        self.db.refresh(record)

        return {
            "record_id": record.id,
            "match_id": match.id,
            "predicted_result": (
                predicted_result
            ),
            "actual_result": actual_result,
            "result_correct": (
                record.result_prediction_correct
            ),
            "over_2_5_correct": (
                record.over_2_5_correct
            ),
            "btts_correct": (
                record.btts_correct
            ),
            "exact_score_correct": (
                record.exact_score_correct
            ),
        }

    def run_backtest(
        self,
        limit: int = 30,
        before_date: str | None = None,
        after_date: str | None = None,
        skip_existing: bool = True,
    ) -> dict[str, Any]:
        matches = self.get_finished_matches(
            limit=limit,
            before_date=before_date,
            after_date=after_date,
        )

        created = 0
        evaluated = 0
        skipped = 0
        failed = 0

        results: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        for match in matches:
            try:
                existing_record = (
                    self.get_existing_record(
                        match.id
                    )
                )

                if (
                    existing_record is not None
                    and skip_existing
                ):
                    skipped += 1

                    if not existing_record.evaluated:
                        evaluation = (
                            self.evaluate_record(
                                match,
                                existing_record,
                            )
                        )

                        evaluated += 1
                        results.append(evaluation)

                    continue

                if (
                    existing_record is not None
                    and not skip_existing
                ):
                    self.db.delete(
                        existing_record
                    )
                    self.db.commit()

                record = (
                    self.create_prediction_record(
                        match
                    )
                )

                created += 1

                evaluation = self.evaluate_record(
                    match,
                    record,
                )

                evaluated += 1
                results.append(evaluation)

            except Exception as error:
                self.db.rollback()

                failed += 1

                errors.append(
                    {
                        "match_id": match.id,
                        "date": match.date,
                        "error": str(error),
                    }
                )

        return {
            "model_version": (
                self.MODEL_VERSION
            ),
            "requested_limit": limit,
            "matches_found": len(matches),
            "created": created,
            "evaluated": evaluated,
            "skipped": skipped,
            "failed": failed,
            "results": results,
            "errors": errors,
        }