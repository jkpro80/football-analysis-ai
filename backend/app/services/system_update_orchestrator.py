from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Callable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.models import (
    FixtureLineup,
    FixtureWeather,
    Match,
    MatchStatistic,
    PredictionRecord,
)
from app.services.auto_calibration_service import (
    AutoCalibrationService,
)
from app.services.elo_service import EloService
from app.services.fixture_context_sync_service import (
    FixtureContextSyncService,
)
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
        3. Refresh fixtures with pending V11 evaluations.
        4. Apply pending ELO updates.
        5. Evaluate finished V11 predictions.
        6. Build calibration and tuning previews.
        7. Generate stored predictions for upcoming fixtures.

    The orchestrator isolates failures at operation level and returns
    one unified execution report.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

        self.sync_service = SportmonksSyncService(db=db)
        self.statistics_service = StatisticsSyncService(db=db)
        self.fixture_context_service = FixtureContextSyncService(db=db)
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
        progress_callback: (
            Callable[[int, str], Awaitable[None]] | None
        ) = None,
    ) -> dict[str, Any]:
        started_at = datetime.now(timezone.utc)
        operations: list[dict[str, Any]] = []

        async def report_progress(
            progress: int,
            message: str,
        ) -> None:
            if progress_callback is not None:
                await progress_callback(
                    progress,
                    message,
                )

        await report_progress(
            5,
            "Synchronizing teams and fixtures...",
        )

        team_sync_result = await self._sync_teams_and_fixtures(
            team_ids=team_ids,
            start_date=start_date,
            end_date=end_date,
            operations=operations,
        )

        await report_progress(
            25,
            "Synchronizing team statistics...",
        )

        statistics_result = self._sync_team_statistics(
            team_ids=team_sync_result["successful_team_ids"],
            statistics_limit=statistics_limit,
            operations=operations,
        )

        await report_progress(
            45,
            "Refreshing finished fixtures for V11 evaluation...",
        )

        pending_fixture_result = (
            await self._refresh_pending_prediction_fixtures(
                prediction_limit=prediction_limit,
                operations=operations,
            )
        )

        await report_progress(
            52,
            "Synchronizing recent finished V11 statistics...",
        )

        finished_statistics_result = (
            self._sync_recent_finished_prediction_statistics(
                prediction_limit=prediction_limit,
                operations=operations,
            )
        )

        await report_progress(
            60,
            "Applying pending ELO updates...",
        )

        elo_result = self._apply_pending_elo(
            elo_limit=elo_limit,
            operations=operations,
        )

        await report_progress(
            72,
            "Evaluating finished V11 predictions...",
        )

        evaluation_result = (
            self._evaluate_finished_predictions(
                operations=operations,
            )
        )

        await report_progress(
            82,
            "Building calibration report...",
        )

        calibration_result = (
            self._build_calibration_report(
                operations=operations,
            )
        )

        await report_progress(
            88,
            "Building V11 tuning preview...",
        )

        tuning_preview_result = (
            self._build_v11_tuning_preview(
                calibration_result=calibration_result,
                operations=operations,
            )
        )

        await report_progress(
            94,
            "Generating upcoming V11 predictions...",
        )

        prediction_result = self.generate_predictions(
            prediction_limit=prediction_limit,
            recent_limit=recent_limit,
            replace_existing_predictions=replace_existing_predictions,
            operations=operations,
        )

        total_failures = (
            team_sync_result["failed"]
            + statistics_result["failed"]
            + pending_fixture_result["failed"]
            + finished_statistics_result["failed"]
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
                "pending_fixtures_found": (
                    pending_fixture_result["found"]
                ),
                "pending_fixtures_updated": (
                    pending_fixture_result["updated"]
                ),
                "pending_fixtures_created": (
                    pending_fixture_result["created"]
                ),
                "pending_fixtures_skipped": (
                    pending_fixture_result["skipped"]
                ),
                "pending_fixture_sync_failed": (
                    pending_fixture_result["failed"]
                ),
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

    async def _refresh_pending_prediction_fixtures(
        self,
        *,
        prediction_limit: int,
        operations: list[dict[str, Any]],
    ) -> dict[str, int]:
        """
        Refresh fixtures with unevaluated V11 predictions whose
        kickoff time has passed before ELO and evaluation run.
        """

        try:
            result = (
                await self.sync_service
                .sync_pending_prediction_fixtures(
                    limit=prediction_limit,
                )
            )

            failed = int(
                result.get("failed", 0)
            )

            results = result.get(
                "results",
                [],
            )

            errors = (
                [
                    item
                    for item in results
                    if isinstance(item, dict)
                    and item.get("status") == "failed"
                ]
                if isinstance(results, list)
                else []
            )

            summary = {
                "found": int(
                    result.get(
                        "fixtures_found",
                        0,
                    )
                ),
                "updated": int(
                    result.get(
                        "updated",
                        0,
                    )
                ),
                "created": int(
                    result.get(
                        "created",
                        0,
                    )
                ),
                "skipped": int(
                    result.get(
                        "skipped",
                        0,
                    )
                ),
                "failed": failed,
            }

            operations.append(
                {
                    "step": (
                        "refresh_pending_prediction_fixtures_v11"
                    ),
                    "status": (
                        "success"
                        if failed == 0
                        else "completed_with_errors"
                    ),
                    "summary": summary,
                    "errors": errors,
                }
            )

            return summary

        except Exception as error:
            self.db.rollback()

            error_message = self._format_error(
                error
            )

            operations.append(
                {
                    "step": (
                        "refresh_pending_prediction_fixtures_v11"
                    ),
                    "status": "failed",
                    "summary": {
                        "found": 0,
                        "updated": 0,
                        "created": 0,
                        "skipped": 0,
                        "failed": 1,
                    },
                    "error": error_message,
                }
            )

            return {
                "found": 0,
                "updated": 0,
                "created": 0,
                "skipped": 0,
                "failed": 1,
            }

    def _sync_recent_finished_prediction_statistics(
        self,
        *,
        prediction_limit: int,
        operations: list[dict[str, Any]],
    ) -> dict[str, int]:
        """
        Retry missing corners/yellow-card statistics for recent finished
        V11 fixtures and refresh already-evaluated records when data arrives.
        """

        safe_limit = max(
            1,
            min(
                int(prediction_limit),
                100,
            ),
        )
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        checked = 0
        incomplete = 0
        synced = 0
        reevaluated = 0
        skipped = 0
        failed = 0
        errors: list[dict[str, Any]] = []

        try:
            statement = (
                select(
                    Match,
                    PredictionRecord,
                )
                .join(
                    PredictionRecord,
                    PredictionRecord.match_id == Match.id,
                )
                .where(
                    PredictionRecord.model_version
                    == PredictionV11RecordService.MODEL_VERSION,
                    Match.status.in_(("5", "finished", "ft")),
                    Match.sportmonks_id.is_not(None),
                    Match.date >= cutoff,
                )
                .order_by(
                    Match.date.desc(),
                    Match.id.desc(),
                )
                .limit(safe_limit)
            )

            rows = self.db.execute(
                statement
            ).all()

            for match, record in rows:
                checked += 1

                try:
                    statistics = self.db.execute(
                        select(MatchStatistic).where(
                            MatchStatistic.fixture_id == match.id
                        )
                    ).scalars().all()

                    statistics_by_team = {
                        statistic.team_id: statistic
                        for statistic in statistics
                    }

                    home_statistics = statistics_by_team.get(
                        match.home_team_id
                    )
                    away_statistics = statistics_by_team.get(
                        match.away_team_id
                    )

                    statistics_complete = (
                        home_statistics is not None
                        and away_statistics is not None
                        and home_statistics.corners is not None
                        and away_statistics.corners is not None
                        and home_statistics.yellow_cards is not None
                        and away_statistics.yellow_cards is not None
                    )

                    if not statistics_complete:
                        incomplete += 1

                        sync_result = (
                            self.statistics_service
                            .sync_fixture_statistics(
                                int(match.sportmonks_id)
                            )
                        )

                        if isinstance(sync_result, dict):
                            result_status = str(
                                sync_result.get("status", "")
                            ).strip().lower()

                            if result_status in {
                                "success",
                                "updated",
                                "created",
                            }:
                                synced += 1

                        statistics = self.db.execute(
                            select(MatchStatistic).where(
                                MatchStatistic.fixture_id == match.id
                            )
                        ).scalars().all()

                        statistics_by_team = {
                            statistic.team_id: statistic
                            for statistic in statistics
                        }

                        home_statistics = statistics_by_team.get(
                            match.home_team_id
                        )
                        away_statistics = statistics_by_team.get(
                            match.away_team_id
                        )

                        statistics_complete = (
                            home_statistics is not None
                            and away_statistics is not None
                            and home_statistics.corners is not None
                            and away_statistics.corners is not None
                            and home_statistics.yellow_cards is not None
                            and away_statistics.yellow_cards is not None
                        )

                    if not statistics_complete:
                        skipped += 1
                        continue

                    needs_refresh = (
                        record.evaluated
                        and (
                            record.actual_total_corners is None
                            or record.actual_total_yellow_cards is None
                        )
                    )

                    if needs_refresh:
                        self.evaluation_service.evaluate_prediction(
                            match_id=match.id,
                            force=True,
                        )
                        reevaluated += 1

                except Exception as error:
                    self.db.rollback()
                    failed += 1
                    errors.append(
                        {
                            "match_id": match.id,
                            "sportmonks_id": match.sportmonks_id,
                            "error": self._format_error(error),
                        }
                    )

            summary = {
                "checked": checked,
                "incomplete": incomplete,
                "synced": synced,
                "reevaluated": reevaluated,
                "skipped": skipped,
                "failed": failed,
            }

            operations.append(
                {
                    "step": (
                        "sync_recent_finished_prediction_statistics_v11"
                    ),
                    "status": (
                        "success"
                        if failed == 0
                        else "completed_with_errors"
                    ),
                    "summary": summary,
                    "errors": errors,
                }
            )

            return summary

        except Exception as error:
            self.db.rollback()

            error_message = self._format_error(
                error
            )

            operations.append(
                {
                    "step": (
                        "sync_recent_finished_prediction_statistics_v11"
                    ),
                    "status": "failed",
                    "summary": {
                        "checked": checked,
                        "incomplete": incomplete,
                        "synced": synced,
                        "reevaluated": reevaluated,
                        "skipped": skipped,
                        "failed": 1,
                    },
                    "error": error_message,
                }
            )

            return {
                "checked": checked,
                "incomplete": incomplete,
                "synced": synced,
                "reevaluated": reevaluated,
                "skipped": skipped,
                "failed": 1,
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


    async def sync_fixture_context(
        self,
        *,
        prediction_limit: int,
        operations: list[dict[str, Any]],
    ) -> dict[str, int]:
        """
        Synchronize fixture context using an API-efficient refresh policy.

        Refresh cadence:
        - More than 24 hours before kickoff: every 12 hours.
        - Between 6 and 24 hours before kickoff: every 3 hours.
        - From 6 hours before until 6 hours after kickoff: every hour.
        - More than 6 hours after kickoff: do not refresh.

        The latest lineup/weather sync timestamp is used as the freshness
        marker. Absence rows are intentionally not required because a
        successful provider response may legitimately contain zero absences.
        """

        now_utc = datetime.now(timezone.utc)
        context_cutoff = (
            now_utc - timedelta(hours=6)
        ).replace(tzinfo=None)

        matches_statement = (
            select(Match)
            .where(
                Match.status.in_(("1", "scheduled", "ns")),
                Match.home_score.is_(None),
                Match.away_score.is_(None),
                Match.sportmonks_id.is_not(None),
                Match.date >= context_cutoff,
            )
            .order_by(Match.date.asc())
            .limit(prediction_limit)
        )

        matches = list(
            self.db.scalars(matches_statement).all()
        )

        synced = 0
        skipped = 0
        fresh_skipped = 0
        failed = 0
        lineups_stored = 0
        absences_stored = 0
        weather_stored = 0
        context_results: list[dict[str, Any]] = []

        for match in matches:
            match_date = match.date

            if match_date.tzinfo is None:
                kickoff_utc = match_date.replace(
                    tzinfo=timezone.utc
                )
            else:
                kickoff_utc = match_date.astimezone(
                    timezone.utc
                )

            until_kickoff = kickoff_utc - now_utc

            # Protect API quota when a stale local status still says
            # "scheduled" long after the fixture should have finished.
            if until_kickoff < timedelta(hours=-6):
                skipped += 1
                context_results.append(
                    {
                        "fixture_id": match.id,
                        "sportmonks_id": match.sportmonks_id,
                        "status": "skipped",
                        "reason": (
                            "Fixture kickoff was more than "
                            "6 hours ago."
                        ),
                    }
                )
                continue

            if until_kickoff > timedelta(hours=24):
                refresh_after = timedelta(hours=12)
            elif until_kickoff > timedelta(hours=6):
                refresh_after = timedelta(hours=3)
            elif until_kickoff > timedelta(minutes=90):
                refresh_after = timedelta(hours=1)
            elif until_kickoff >= timedelta(hours=-2):
                refresh_after = timedelta(minutes=15)
            else:
                refresh_after = timedelta(hours=1)

            lineup_synced_at = self.db.scalar(
                select(
                    func.max(FixtureLineup.synced_at)
                ).where(
                    FixtureLineup.fixture_id == match.id
                )
            )

            weather_synced_at = self.db.scalar(
                select(
                    func.max(FixtureWeather.synced_at)
                ).where(
                    FixtureWeather.fixture_id == match.id
                )
            )

            sync_candidates = [
                value
                for value in (
                    lineup_synced_at,
                    weather_synced_at,
                )
                if value is not None
            ]

            last_synced_at = (
                max(sync_candidates)
                if sync_candidates
                else None
            )

            if last_synced_at is not None:
                if last_synced_at.tzinfo is None:
                    last_synced_at = last_synced_at.replace(
                        tzinfo=timezone.utc
                    )
                else:
                    last_synced_at = (
                        last_synced_at.astimezone(
                            timezone.utc
                        )
                    )

                age = now_utc - last_synced_at

                if age < refresh_after:
                    skipped += 1
                    fresh_skipped += 1

                    context_results.append(
                        {
                            "fixture_id": match.id,
                            "sportmonks_id": match.sportmonks_id,
                            "status": "skipped",
                            "reason": (
                                "Fixture context is still fresh."
                            ),
                            "last_synced_at": (
                                last_synced_at.isoformat()
                            ),
                            "refresh_after_seconds": int(
                                refresh_after.total_seconds()
                            ),
                        }
                    )
                    continue

            try:
                result = (
                    await self.fixture_context_service.sync_match(
                        match_id=match.id
                    )
                )

                synced += 1

                lineups = result.get("lineups") or {}
                absences = result.get("absences") or {}
                weather = result.get("weather") or {}

                lineups_stored += int(
                    lineups.get("stored", 0)
                )
                absences_stored += int(
                    absences.get("stored", 0)
                )
                weather_stored += int(
                    weather.get("stored", 0)
                )

                context_results.append(
                    {
                        "fixture_id": match.id,
                        "sportmonks_id": match.sportmonks_id,
                        "status": "success",
                        "lineups": lineups,
                        "absences": absences,
                        "weather": weather,
                    }
                )

            except SportmonksAPIError as error:
                self.db.rollback()

                if self._is_expected_sportmonks_skip(
                    error
                ):
                    skipped += 1

                    context_results.append(
                        {
                            "fixture_id": match.id,
                            "sportmonks_id": match.sportmonks_id,
                            "status": "skipped",
                            "reason": (
                                "Fixture context is not "
                                "available in the current "
                                "SportMonks subscription."
                            ),
                            "error": self._format_error(
                                error
                            ),
                        }
                    )
                    continue

                failed += 1

                context_results.append(
                    {
                        "fixture_id": match.id,
                        "sportmonks_id": match.sportmonks_id,
                        "status": "failed",
                        "error": self._format_error(
                            error
                        ),
                    }
                )

            except Exception as error:
                self.db.rollback()
                failed += 1

                context_results.append(
                    {
                        "fixture_id": match.id,
                        "sportmonks_id": match.sportmonks_id,
                        "status": "failed",
                        "error": self._format_error(
                            error
                        ),
                    }
                )

        summary = {
            "matches_found": len(matches),
            "synced": synced,
            "skipped": skipped,
            "fresh_skipped": fresh_skipped,
            "failed": failed,
            "lineups_stored": lineups_stored,
            "absences_stored": absences_stored,
            "weather_stored": weather_stored,
        }

        operations.append(
            {
                "step": "sync_fixture_context",
                "status": (
                    "success"
                    if failed == 0
                    else "completed_with_errors"
                ),
                "summary": summary,
                "results": context_results,
            }
        )

        return summary


    def generate_predictions(
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
                "step": "generate_predictions_v11",
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
