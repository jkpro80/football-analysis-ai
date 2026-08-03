from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Match
from app.services.auto_calibration_service import (
    AutoCalibrationService,
)
from app.services.elo_service import EloService
from app.services.model_tuning_service import ModelTuningService
from app.services.prediction_evaluation_service import (
    PredictionEvaluationService,
)
from app.services.prediction_v11_record_service import (
    PredictionV11RecordService,
)

from app.services.sportmonks_service import SportmonksAPIError
from app.services.statistics_sync_service import (
    StatisticsSyncService,
)
from app.services.sync_service import SportmonksSyncService


class SystemUpdateOrchestrator:
    """
    Central orchestrator for the Football Analysis update workflow.

    This class coordinates existing services without duplicating their
    internal business logic.

    Current workflow:
        1. Synchronize teams and fixtures.
        2. Synchronize team statistics.
        3. Apply pending ELO updates.
        4. Generate stored predictions for upcoming fixtures.

    The orchestrator isolates failures at operation level and returns
    one unified execution report.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

        self.sync_service = SportmonksSyncService(db=db)
        self.statistics_service = StatisticsSyncService(db=db)
        self.elo_service = EloService(db=db)
        self.calibration_service = AutoCalibrationService(db=db)
        self.v11_tuning_service = ModelTuningService(
            db=db,
            source_model_version=(
                PredictionV11RecordService.MODEL_VERSION
            ),
            tuned_model_version="Prediction Engine V11.1",
            config_path=(
                "/app/app/config/model_weights_v11.json"
            ),
        )
        self.evaluation_service = PredictionEvaluationService(
            db=db,
            model_version=PredictionV11RecordService.MODEL_VERSION,
        )
        self.prediction_service = PredictionV11RecordService(db=db)

    async def run(
        self,
        *,
        team_ids: list[int],
        start_date: str,
        end_date: str,
        statistics_limit: int,
        elo_limit: int,
        prediction_limit: int,
        recent_limit: int,
        replace_existing_predictions: bool,
    ) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc)
        operations: list[dict[str, Any]] = []

        team_sync_result = await self._sync_teams_and_fixtures(
            team_ids=team_ids,
            start_date=start_date,
            end_date=end_date,
            operations=operations,
        )

        statistics_result = self._sync_team_statistics(
            team_ids=team_sync_result["successful_team_ids"],
            statistics_limit=statistics_limit,
            operations=operations,
        )

        elo_result = self._apply_pending_elo(
            elo_limit=elo_limit,
            operations=operations,
        )

        evaluation_result = (
            self._evaluate_finished_predictions(
                operations=operations,
            )
        )

        calibration_result = (
            self._build_calibration_report(
                operations=operations,
            )
        )

        tuning_preview_result = (
            self._build_v11_tuning_preview(
                calibration_result=calibration_result,
                operations=operations,
            )
        )

        prediction_result = self._generate_predictions(
            prediction_limit=prediction_limit,
            recent_limit=recent_limit,
            replace_existing_predictions=replace_existing_predictions,
            operations=operations,
        )

        total_failures = (
            team_sync_result["failed"]
            + statistics_result["failed"]
            + (1 if elo_result["status"] == "failed" else 0)
            + evaluation_result["failed"]
            + calibration_result["failed"]
            + tuning_preview_result["failed"]
            + prediction_result["failed"]
        )

        finished_at = datetime.now(timezone.utc)
        duration_seconds = round(
            (finished_at - started_at).total_seconds(),
            3,
        )

        return {
            "status": (
                "success"
                if total_failures == 0
                else "completed_with_errors"
            ),
            "engine": {
                "name": "Football Analysis System Update Orchestrator",
                "version": "11",
                "prediction_model": (
                    PredictionV11RecordService.MODEL_VERSION
                ),
            },
            "execution": {
                "started_at": started_at.isoformat(),
                "finished_at": finished_at.isoformat(),
                "duration_seconds": duration_seconds,
            },
            "configuration": {
                "team_ids": team_ids,
                "start_date": start_date,
                "end_date": end_date,
                "statistics_limit": statistics_limit,
                "elo_limit": elo_limit,
                "prediction_limit": prediction_limit,
                "recent_limit": recent_limit,
                "replace_existing_predictions": (
                    replace_existing_predictions
                ),
            },
            "summary": {
                "teams_requested": len(team_ids),
                "teams_synced": team_sync_result["success"],
                "teams_skipped": team_sync_result["skipped"],
                "team_sync_failed": team_sync_result["failed"],
                "statistics_updated": statistics_result["success"],
                "statistics_skipped": statistics_result["skipped"],
                "statistics_failed": statistics_result["failed"],
                "elo_status": elo_result["status"],
                "evaluation_records_found": (
                    evaluation_result["found"]
                ),
                "predictions_evaluated": (
                    evaluation_result["evaluated"]
                ),
                "prediction_evaluation_failed": (
                    evaluation_result["failed"]
                ),
                "calibration_status": (
                    calibration_result["status"]
                ),
                "calibration_sample_size": (
                    calibration_result["sample_size"]
                ),
                "calibration_minimum_required": (
                    calibration_result[
                        "minimum_required"
                    ]
                ),
                "calibration_ready": (
                    calibration_result[
                        "calibration_ready"
                    ]
                ),
                "v11_tuning_status": (
                    tuning_preview_result["status"]
                ),
                "v11_tuning_config_built": (
                    tuning_preview_result["config_built"]
                ),
                "v11_tuning_saved": (
                    tuning_preview_result["saved"]
                ),
                "prediction_matches_found": (
                    prediction_result["matches_found"]
                ),
                "predictions_created": prediction_result["created"],
                "predictions_replaced": prediction_result["replaced"],
                "predictions_skipped": prediction_result["skipped"],
                "predictions_failed": prediction_result["failed"],
                "total_failures": total_failures,
            },
            "operations": operations,
        }

    async def _sync_teams_and_fixtures(
        self,
        *,
        team_ids: list[int],
        start_date: str,
        end_date: str,
        operations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        success = 0
        skipped = 0
        failed = 0
        successful_team_ids: list[int] = []

        for sportmonks_team_id in team_ids:
            try:
                result = (
                    await self.sync_service.sync_team_and_fixtures(
                        sportmonks_team_id=sportmonks_team_id,
                        start_date=start_date,
                        end_date=end_date,
                    )
                )

                success += 1
                successful_team_ids.append(sportmonks_team_id)
                operations.append(
                    {
                        "step": "sync_team_and_fixtures",
                        "sportmonks_team_id": sportmonks_team_id,
                        "status": "success",
                        "result": result,
                    }
                )

            except SportmonksAPIError as error:
                self.db.rollback()

                if self._is_expected_sportmonks_skip(error):
                    skipped += 1
                    operations.append(
                        {
                            "step": "sync_team_and_fixtures",
                            "sportmonks_team_id": sportmonks_team_id,
                            "status": "skipped",
                            "reason": (
                                "Team is not available in the current "
                                "SportMonks subscription."
                            ),
                            "error": self._format_error(error),
                        }
                    )
                    continue

                failed += 1
                operations.append(
                    {
                        "step": "sync_team_and_fixtures",
                        "sportmonks_team_id": sportmonks_team_id,
                        "status": "failed",
                        "error": self._format_error(error),
                    }
                )

            except Exception as error:
                self.db.rollback()
                failed += 1
                operations.append(
                    {
                        "step": "sync_team_and_fixtures",
                        "sportmonks_team_id": sportmonks_team_id,
                        "status": "failed",
                        "error": self._format_error(error),
                    }
                )

        return {
            "success": success,
            "skipped": skipped,
            "failed": failed,
            "successful_team_ids": successful_team_ids,
        }

    def _sync_team_statistics(
        self,
        *,
        team_ids: list[int],
        statistics_limit: int,
        operations: list[dict[str, Any]],
    ) -> dict[str, int]:
        success = 0
        skipped = 0
        failed = 0

        for sportmonks_team_id in team_ids:
            try:
                result = (
                    self.statistics_service.sync_team_statistics(
                        sportmonks_team_id=sportmonks_team_id,
                        limit=statistics_limit,
                    )
                )

                success += 1
                operations.append(
                    {
                        "step": "sync_team_statistics",
                        "sportmonks_team_id": sportmonks_team_id,
                        "status": "success",
                        "result": result,
                    }
                )

            except SportmonksAPIError as error:
                self.db.rollback()

                if self._is_expected_sportmonks_skip(error):
                    skipped += 1
                    operations.append(
                        {
                            "step": "sync_team_statistics",
                            "sportmonks_team_id": sportmonks_team_id,
                            "status": "skipped",
                            "reason": (
                                "Statistics are not available in the "
                                "current SportMonks subscription."
                            ),
                            "error": self._format_error(error),
                        }
                    )
                    continue

                failed += 1
                operations.append(
                    {
                        "step": "sync_team_statistics",
                        "sportmonks_team_id": sportmonks_team_id,
                        "status": "failed",
                        "error": self._format_error(error),
                    }
                )

            except Exception as error:
                self.db.rollback()
                failed += 1
                operations.append(
                    {
                        "step": "sync_team_statistics",
                        "sportmonks_team_id": sportmonks_team_id,
                        "status": "failed",
                        "error": self._format_error(error),
                    }
                )

        return {
            "success": success,
            "skipped": skipped,
            "failed": failed,
        }

    def _apply_pending_elo(
        self,
        *,
        elo_limit: int,
        operations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        try:
            result = self.elo_service.apply_pending_fixtures(
                limit=elo_limit,
            )

            operation = {
                "step": "apply_pending_elo",
                "status": "success",
                "result": result,
            }
            operations.append(operation)

            return {
                "status": "success",
                "result": result,
            }

        except Exception as error:
            self.db.rollback()

            error_message = self._format_error(error)
            operations.append(
                {
                    "step": "apply_pending_elo",
                    "status": "failed",
                    "error": error_message,
                }
            )

            return {
                "status": "failed",
                "error": error_message,
            }

    def _evaluate_finished_predictions(
        self,
        *,
        operations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        try:
            result = (
                self.evaluation_service
                .evaluate_all_finished_matches()
            )

            operations.append(
                {
                    "step": "evaluate_finished_predictions_v11",
                    "status": (
                        "success"
                        if result.get("failed", 0) == 0
                        else "completed_with_errors"
                    ),
                    "summary": {
                        "found": result.get("found", 0),
                        "evaluated": result.get(
                            "evaluated",
                            0,
                        ),
                        "failed": result.get("failed", 0),
                    },
                    "errors": result.get("errors", []),
                }
            )

            return {
                "found": int(result.get("found", 0)),
                "evaluated": int(
                    result.get("evaluated", 0)
                ),
                "failed": int(result.get("failed", 0)),
            }

        except Exception as error:
            self.db.rollback()

            error_message = self._format_error(error)

            operations.append(
                {
                    "step": "evaluate_finished_predictions_v11",
                    "status": "failed",
                    "summary": {
                        "found": 0,
                        "evaluated": 0,
                        "failed": 1,
                    },
                    "error": error_message,
                }
            )

            return {
                "found": 0,
                "evaluated": 0,
                "failed": 1,
            }


    def _build_calibration_report(
        self,
        *,
        operations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        try:
            result = self.calibration_service.calibrate(
                model_version=(
                    PredictionV11RecordService.MODEL_VERSION
                ),
                limit=1000,
            )

            calibration_ready = bool(
                result.get("calibration_ready", False)
            )

            operations.append(
                {
                    "step": "calibration_report_v11",
                    "status": (
                        "ready"
                        if calibration_ready
                        else "waiting_for_samples"
                    ),
                    "summary": {
                        "model_version": result.get(
                            "model_version"
                        ),
                        "sample_size": int(
                            result.get("sample_size", 0)
                        ),
                        "minimum_required": int(
                            result.get(
                                "minimum_required",
                                30,
                            )
                        ),
                        "calibration_ready": (
                            calibration_ready
                        ),
                        "applied": bool(
                            result.get("applied", False)
                        ),
                    },
                    "accuracy": result.get("accuracy", {}),
                    "mean_absolute_error": result.get(
                        "mean_absolute_error",
                        {},
                    ),
                    "recommendations": result.get(
                        "recommendations",
                        {},
                    ),
                    "message": result.get("message"),
                }
            )

            return {
                "status": (
                    "ready"
                    if calibration_ready
                    else "waiting_for_samples"
                ),
                "sample_size": int(
                    result.get("sample_size", 0)
                ),
                "minimum_required": int(
                    result.get("minimum_required", 30)
                ),
                "calibration_ready": calibration_ready,
                "failed": 0,
            }

        except Exception as error:
            self.db.rollback()

            error_message = self._format_error(error)

            operations.append(
                {
                    "step": "calibration_report_v11",
                    "status": "failed",
                    "summary": {
                        "sample_size": 0,
                        "minimum_required": 30,
                        "calibration_ready": False,
                    },
                    "error": error_message,
                }
            )

            return {
                "status": "failed",
                "sample_size": 0,
                "minimum_required": 30,
                "calibration_ready": False,
                "failed": 1,
            }


    def _build_v11_tuning_preview(
        self,
        *,
        calibration_result: dict[str, Any],
        operations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if not calibration_result.get(
            "calibration_ready",
            False,
        ):
            result = {
                "status": "waiting_for_calibration",
                "config_built": False,
                "saved": False,
                "failed": 0,
            }

            operations.append(
                {
                    "step": "v11_tuning_preview",
                    "status": result["status"],
                    "summary": result,
                }
            )

            return result

        try:
            save_result = (
                self.v11_tuning_service.save_config(
                    limit=1000,
                    enabled=False,
                )
            )

            config = save_result.get(
                "config",
                {},
            )

            result = {
                "status": "ready_for_review",
                "config_built": True,
                "saved": bool(
                    save_result.get("saved", False)
                ),
                "enabled": bool(
                    save_result.get("enabled", False)
                ),
                "config_path": save_result.get(
                    "config_path"
                ),
                "failed": 0,
                "source_model_version": config.get(
                    "source_model_version"
                ),
                "model_version": config.get(
                    "model_version"
                ),
                "sample_size": int(
                    config.get("sample_size", 0)
                ),
            }

            operations.append(
                {
                    "step": "v11_tuning_preview",
                    "status": result["status"],
                    "summary": result,
                    "weights": {
                        "home_goal_multiplier": config.get(
                            "home_goal_multiplier"
                        ),
                        "away_goal_multiplier": config.get(
                            "away_goal_multiplier"
                        ),
                        "total_goal_multiplier": config.get(
                            "total_goal_multiplier"
                        ),
                        "attack_multiplier": config.get(
                            "attack_multiplier"
                        ),
                        "home_advantage_multiplier": config.get(
                            "home_advantage_multiplier"
                        ),
                    },
                    "accuracy_snapshot": config.get(
                        "accuracy_snapshot",
                        {},
                    ),
                    "mean_absolute_error_snapshot": config.get(
                        "mean_absolute_error_snapshot",
                        {},
                    ),
                }
            )

            return result

        except Exception as error:
            self.db.rollback()

            result = {
                "status": "failed",
                "config_built": False,
                "saved": False,
                "failed": 1,
            }

            operations.append(
                {
                    "step": "v11_tuning_preview",
                    "status": "failed",
                    "summary": result,
                    "error": self._format_error(error),
                }
            )

            return result


    def _generate_predictions(
        self,
        *,
        prediction_limit: int,
        recent_limit: int,
        replace_existing_predictions: bool,
        operations: list[dict[str, Any]],
    ) -> dict[str, int]:
        matches_statement = (
            select(Match)
            .where(
                Match.status.in_(("1", "scheduled", "ns")),
                Match.home_score.is_(None),
                Match.away_score.is_(None),
            )
            .order_by(Match.date.asc())
            .limit(prediction_limit)
        )

        matches = list(
            self.db.scalars(matches_statement).all()
        )

        created = 0
        replaced = 0
        skipped = 0
        failed = 0

        prediction_results: list[dict[str, Any]] = []

        for match in matches:
            try:
                result = (
                    self.prediction_service.save_fixture_prediction(
                        fixture_id=match.id,
                        recent_limit=recent_limit,
                        replace_existing=(
                            replace_existing_predictions
                        ),
                    )
                )

                if result.get("created") is True:
                    item_status = "created"
                    created += 1

                elif result.get("replaced") is True:
                    item_status = "replaced"
                    replaced += 1

                else:
                    item_status = "skipped"
                    skipped += 1

                record = result.get("record") or {}

                prediction_results.append(
                    {
                        "fixture_id": match.id,
                        "sportmonks_id": getattr(
                            match,
                            "sportmonks_id",
                            None,
                        ),
                        "status": item_status,
                        "record_id": record.get("id"),
                        "message": result.get("message"),
                    }
                )

            except Exception as error:
                self.db.rollback()
                failed += 1

                prediction_results.append(
                    {
                        "fixture_id": match.id,
                        "sportmonks_id": getattr(
                            match,
                            "sportmonks_id",
                            None,
                        ),
                        "status": "failed",
                        "error": self._format_error(error),
                    }
                )

        operations.append(
            {
                "step": f"generate_predictions_v{PredictionV11RecordService.MODEL_VERSION}",
                "status": (
                    "success"
                    if failed == 0
                    else "completed_with_errors"
                ),
                "summary": {
                    "matches_found": len(matches),
                    "created": created,
                    "replaced": replaced,
                    "skipped": skipped,
                    "failed": failed,
                },
                "results": prediction_results,
            }
        )

        return {
            "matches_found": len(matches),
            "created": created,
            "replaced": replaced,
            "skipped": skipped,
            "failed": failed,
        }


    @staticmethod
    def _is_expected_sportmonks_skip(error: Exception) -> bool:
        """
        Return True when SportMonks reports that the requested resource
        is unavailable because of subscription limitations or because
        the resource does not exist.
        """
        message = str(error).strip().lower()

        expected_patterns = (
            "no result(s) found matching your request",
            "don't have access to it via your current subscription",
            "do not have access to it via your current subscription",
            "does not allow this resource",
            "resource was not found",
            "resource not found",
            "not available in the current subscription",
        )

        return any(pattern in message for pattern in expected_patterns)

    @staticmethod
    def _format_error(error: Exception) -> str:
        return f"{type(error).__name__}: {error}"















