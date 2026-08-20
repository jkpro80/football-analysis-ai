from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.latest.mapper_v11 import PredictionMapperV11
from app.database.models import Match
from app.services.prediction_v11_service import PredictionV11Service
from app.services.prediction_v11_record_service import (
    PredictionV11RecordService,
)


class PredictionV11UpcomingService:
    """
    إنشاء توقعات V11 للمباريات القادمة.

    تعيد الخدمة:
    1. بيانات Latest API الأصلية.
    2. حقول توافق تستخدمها الصفحة الرئيسية الحالية.
    """

    def __init__(
        self,
        db: Session,
        max_goals: int = 8,
        top_scores_count: int = 10,
    ) -> None:
        self.db = db
        self.max_goals = max_goals
        self.top_scores_count = top_scores_count

    @staticmethod
    def _as_dict(value: Any) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

    @staticmethod
    def _as_float(
        value: Any,
        default: float = 0.0,
    ) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _first_value(
        *values: Any,
        default: Any = None,
    ) -> Any:
        for value in values:
            if value is not None:
                return value

        return default

    @classmethod
    def _build_best_pick(
        cls,
        probabilities: dict[str, Any],
    ) -> dict[str, Any] | None:
        candidates = [
            {
                "key": "home_win",
                "label": "فوز الفريق المضيف",
                "probability": cls._as_float(
                    probabilities.get("home_win")
                ),
            },
            {
                "key": "draw",
                "label": "التعادل",
                "probability": cls._as_float(
                    probabilities.get("draw")
                ),
            },
            {
                "key": "away_win",
                "label": "فوز الفريق الضيف",
                "probability": cls._as_float(
                    probabilities.get("away_win")
                ),
            },
            {
                "key": "over_2_5",
                "label": "أكثر من 2.5 هدف",
                "probability": cls._as_float(
                    probabilities.get("over_2_5")
                ),
            },
            {
                "key": "under_2_5",
                "label": "أقل من 2.5 هدف",
                "probability": cls._as_float(
                    probabilities.get("under_2_5")
                ),
            },
            {
                "key": "btts",
                "label": "تسجيل الفريقين",
                "probability": cls._as_float(
                    probabilities.get("btts")
                ),
            },
            {
                "key": "no_btts",
                "label": "عدم تسجيل الفريقين",
                "probability": cls._as_float(
                    probabilities.get("no_btts")
                ),
            },
        ]

        valid_candidates = [
            candidate
            for candidate in candidates
            if candidate["probability"] > 0
        ]

        if not valid_candidates:
            return None

        return max(
            valid_candidates,
            key=lambda candidate: candidate["probability"],
        )

    @classmethod
    def build_home_compatibility(
        cls,
        match: Match,
        mapped: dict[str, Any],
        result: dict[str, Any],
    ) -> dict[str, Any]:
        mapped_match = cls._as_dict(
            mapped.get("match")
        )

        prediction = cls._as_dict(
            mapped.get("prediction")
        )

        markets = cls._as_dict(
            mapped.get("markets")
        )

        meta = cls._as_dict(
            mapped.get("meta")
        )

        raw_record = cls._as_dict(
            result.get("record")
        )

        raw_prediction = cls._as_dict(
            result.get("prediction")
        )

        raw_markets = cls._as_dict(
            result.get("markets")
        )

        expected_goals = cls._as_dict(
            prediction.get("expected_goals")
        )

        if not expected_goals:
            expected_goals = cls._as_dict(
                raw_prediction.get("expected_goals")
            )

        match_result = cls._as_dict(
            markets.get("match_result")
        )

        if not match_result:
            match_result = cls._as_dict(
                markets.get("result")
            )

        if not match_result:
            match_result = cls._as_dict(
                raw_markets.get("match_result")
            )

        totals = cls._as_dict(
            markets.get("totals")
        )

        if not totals:
            totals = cls._as_dict(
                raw_markets.get("totals")
            )

        total_25 = cls._as_dict(
            totals.get("2.5")
        )

        if not total_25:
            total_25 = cls._as_dict(
                totals.get("2_5")
            )

        btts_market = cls._as_dict(
            markets.get("btts")
        )

        if not btts_market:
            btts_market = cls._as_dict(
                raw_markets.get("btts")
            )

        probabilities = {
            "home_win": cls._as_float(
                cls._first_value(
                    match_result.get("home_win"),
                    prediction.get("home_win_probability"),
                    raw_prediction.get(
                        "home_win_probability"
                    ),
                )
            ),
            "draw": cls._as_float(
                cls._first_value(
                    match_result.get("draw"),
                    prediction.get("draw_probability"),
                    raw_prediction.get(
                        "draw_probability"
                    ),
                )
            ),
            "away_win": cls._as_float(
                cls._first_value(
                    match_result.get("away_win"),
                    prediction.get("away_win_probability"),
                    raw_prediction.get(
                        "away_win_probability"
                    ),
                )
            ),
            "over_2_5": cls._as_float(
                cls._first_value(
                    total_25.get("over"),
                    markets.get("over_2_5"),
                    raw_markets.get("over_2_5"),
                )
            ),
            "under_2_5": cls._as_float(
                cls._first_value(
                    total_25.get("under"),
                    markets.get("under_2_5"),
                    raw_markets.get("under_2_5"),
                )
            ),
            "btts": cls._as_float(
                cls._first_value(
                    btts_market.get("yes"),
                    btts_market.get("btts_yes"),
                    markets.get("btts"),
                    raw_markets.get("btts"),
                )
            ),
            "no_btts": cls._as_float(
                cls._first_value(
                    btts_market.get("no"),
                    btts_market.get("btts_no"),
                    markets.get("no_btts"),
                    raw_markets.get("no_btts"),
                )
            ),
        }

        score_data = cls._as_dict(
            prediction.get("most_likely_score")
        )

        if not score_data:
            score_data = cls._as_dict(
                raw_prediction.get(
                    "most_likely_score"
                )
            )

        predicted_score = cls._first_value(
            raw_record.get("predicted_score"),
            prediction.get("predicted_score"),
            raw_prediction.get("predicted_score"),
            score_data.get("score"),
        )

        if predicted_score is None:
            score_home = cls._first_value(
                score_data.get("home"),
                score_data.get("home_goals"),
            )

            score_away = cls._first_value(
                score_data.get("away"),
                score_data.get("away_goals"),
            )

            if (
                score_home is not None
                and score_away is not None
            ):
                predicted_score = (
                    f"{score_home}-{score_away}"
                )

        confidence_data = cls._as_dict(
            prediction.get("confidence")
        )

        if not confidence_data:
            confidence_data = cls._as_dict(
                raw_prediction.get("confidence")
            )

        confidence_label = cls._first_value(
            confidence_data.get("label"),
            confidence_data.get("level"),
            meta.get("confidence_label"),
            default="Unknown",
        )

        confidence_score = cls._as_float(
            cls._first_value(
                confidence_data.get("confidence"),
                confidence_data.get("score"),
                confidence_data.get("value"),
                meta.get("confidence_score"),
                default=0,
            )
        )

        home_team = match.home_team
        away_team = match.away_team

        mapped_home_team = cls._as_dict(
            mapped_match.get("home_team")
        )

        mapped_away_team = cls._as_dict(
            mapped_match.get("away_team")
        )

        expected_home = cls._as_float(
            cls._first_value(
                expected_goals.get("home"),
                expected_goals.get(
                    "home_expected_goals"
                ),
                raw_prediction.get(
                    "home_expected_goals"
                ),
                default=0,
            )
        )

        expected_away = cls._as_float(
            cls._first_value(
                expected_goals.get("away"),
                expected_goals.get(
                    "away_expected_goals"
                ),
                raw_prediction.get(
                    "away_expected_goals"
                ),
                default=0,
            )
        )

        expected_total = cls._as_float(
            cls._first_value(
                expected_goals.get("total"),
                expected_goals.get(
                    "total_expected_goals"
                ),
                raw_prediction.get(
                    "total_expected_goals"
                ),
                default=expected_home + expected_away,
            )
        )

        return {
            "prediction_record_id": match.id,
            "fixture": {
                "id": match.id,
                "sportmonks_id": (
                    match.sportmonks_id
                ),
                "date": match.date,
                "status": (
                    match.status or "scheduled"
                ),
            },
            "league": {
                "name": getattr(
                    match,
                    "league_name",
                    None,
                ),
                "logo": getattr(
                    match,
                    "league_logo",
                    None,
                ),
            },
            "season": {
                "name": getattr(
                    match,
                    "season_name",
                    None,
                ),
            },
            "round": getattr(
                match,
                "round_name",
                None,
            ),
            "stage": getattr(
                match,
                "stage_name",
                None,
            ),
            "venue": {
                "name": getattr(
                    match,
                    "venue_name",
                    None,
                ),
                "city": getattr(
                    match,
                    "venue_city",
                    None,
                ),
                "capacity": getattr(
                    match,
                    "venue_capacity",
                    None,
                ),
                "image": getattr(
                    match,
                    "venue_image",
                    None,
                ),
            },
            "referee": {
                "name": getattr(
                    match,
                    "referee_name",
                    None,
                ),
            },
            "teams": {
                "home": {
                    "id": cls._first_value(
                        getattr(
                            home_team,
                            "id",
                            None,
                        ),
                        mapped_home_team.get("id"),
                        match.home_team_id,
                    ),
                    "name": cls._first_value(
                        getattr(
                            home_team,
                            "name",
                            None,
                        ),
                        mapped_home_team.get("name"),
                        default="الفريق المضيف",
                    ),
                    "country": cls._first_value(
                        getattr(
                            home_team,
                            "country",
                            None,
                        ),
                        mapped_home_team.get(
                            "country"
                        ),
                    ),
                    "logo_url": cls._first_value(
                        getattr(
                            home_team,
                            "logo_url",
                            None,
                        ),
                        mapped_home_team.get(
                            "logo_url"
                        ),
                        mapped_home_team.get("logo"),
                    ),
                },
                "away": {
                    "id": cls._first_value(
                        getattr(
                            away_team,
                            "id",
                            None,
                        ),
                        mapped_away_team.get("id"),
                        match.away_team_id,
                    ),
                    "name": cls._first_value(
                        getattr(
                            away_team,
                            "name",
                            None,
                        ),
                        mapped_away_team.get("name"),
                        default="الفريق الضيف",
                    ),
                    "country": cls._first_value(
                        getattr(
                            away_team,
                            "country",
                            None,
                        ),
                        mapped_away_team.get(
                            "country"
                        ),
                    ),
                    "logo_url": cls._first_value(
                        getattr(
                            away_team,
                            "logo_url",
                            None,
                        ),
                        mapped_away_team.get(
                            "logo_url"
                        ),
                        mapped_away_team.get("logo"),
                    ),
                },
            },
            "expected_goals": {
                "home": expected_home,
                "away": expected_away,
                "total": expected_total,
            },
            "probabilities": probabilities,
            "predicted_score": predicted_score,
            "best_pick": cls._build_best_pick(
                probabilities
            ),
            "confidence": {
                "label": str(confidence_label),
                "score": confidence_score,
            },
            "model_version": cls._first_value(
                result.get("model"),
                mapped.get("engine_version"),
                default="Prediction Engine V11 11.0.1",
            ),
        }

    def get_upcoming_predictions(
        self,
        limit: int = 50,
        history_limit: int = 5,
    ) -> dict[str, Any]:
        safe_limit = max(
            1,
            min(limit, 100),
        )

        safe_history_limit = max(
            1,
            min(history_limit, 20),
        )

        statement = (
            select(Match)
            .options(
                joinedload(Match.home_team),
                joinedload(Match.away_team),
            )
            .where(
                Match.home_score.is_(None),
                Match.away_score.is_(None),
            )
            .order_by(
                Match.date.asc(),
                Match.id.asc(),
            )
            .limit(safe_limit)
        )

        matches = list(
            self.db.scalars(statement).unique().all()
        )

        prediction_service = PredictionV11Service(
            db=self.db,
        )

        predictions: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []
        detected_engine_version: str | None = None

        for match in matches:
            try:
                result = prediction_service.predict_match(
                    match_id=match.id,
                    history_limit=safe_history_limit,
                    max_goals=self.max_goals,
                    top_scores_count=self.top_scores_count,
                )

                mapped = PredictionMapperV11.to_latest(
                    result
                )

                compatibility = self.build_home_compatibility(
                    match=match,
                    mapped=mapped,
                    result=result,
                )

                engine_version = str(
                    result.get(
                        "model",
                        "Prediction Engine V11 11.0.1",
                    )
                )

                if detected_engine_version is None:
                    detected_engine_version = engine_version

                predictions.append(
                    {
                        "api_version": (
                            "Latest Prediction API V1"
                        ),
                        "engine_version": engine_version,
                        **mapped,
                        **compatibility,
                    }
                )

            except Exception as exc:
                errors.append(
                    {
                        "match_id": match.id,
                        "error": str(exc),
                    }
                )

        engine_version = (
            detected_engine_version
            or "Prediction Engine V11 11.0.1"
        )

        return {
            "status": "success",
            "api_version": "Latest Prediction API V1",
            "model_version": engine_version,
            "engine_version": engine_version,
            "configuration": {
                "limit": safe_limit,
                "history_limit": safe_history_limit,
                "max_goals": self.max_goals,
                "top_scores_count": self.top_scores_count,
            },
            "count": len(predictions),
            "failed_count": len(errors),
            "predictions": predictions,
            "errors": errors,
        }
    def get_finished_predictions(
        self,
        limit: int = 50,
        history_limit: int = 5,
    ) -> dict[str, Any]:
        safe_limit = max(1, min(limit, 100))
        safe_history_limit = max(1, min(history_limit, 20))

        statement = (
            select(Match)
            .options(
                joinedload(Match.home_team),
                joinedload(Match.away_team),
            )
            .where(
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(safe_limit)
        )

        matches = list(
            self.db.scalars(statement).unique().all()
        )

        prediction_service = PredictionV11Service(
            db=self.db,
        )

        predictions: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []
        detected_engine_version: str | None = None

        for match in matches:
            try:
                result = prediction_service.predict_match(
                    match_id=match.id,
                    history_limit=safe_history_limit,
                    max_goals=self.max_goals,
                    top_scores_count=self.top_scores_count,
                )

                mapped = PredictionMapperV11.to_latest(
                    result
                )

                compatibility = self.build_home_compatibility(
                    match=match,
                    mapped=mapped,
                    result=result,
                )

                engine_version = str(
                    result.get(
                        "model",
                        "Prediction Engine V11 11.0.1",
                    )
                )

                if detected_engine_version is None:
                    detected_engine_version = engine_version

                predictions.append(
                    {
                        "api_version": "Latest Prediction API V1",
                        "engine_version": engine_version,
                        **mapped,
                        **compatibility,
                    }
                )

            except Exception as exc:
                errors.append(
                    {
                        "match_id": match.id,
                        "error": str(exc),
                    }
                )

        engine_version = (
            detected_engine_version
            or "Prediction Engine V11 11.0.1"
        )

        return {
            "status": "success",
            "api_version": "Latest Prediction API V1",
            "model_version": engine_version,
            "engine_version": engine_version,
            "configuration": {
                "limit": safe_limit,
                "history_limit": safe_history_limit,
                "max_goals": self.max_goals,
                "top_scores_count": self.top_scores_count,
            },
            "count": len(predictions),
            "failed_count": len(errors),
            "predictions": predictions,
            "errors": errors,
        }
    def get_latest_predictions(
        self,
        limit: int = 50,
        history_limit: int = 5,
    ) -> dict[str, Any]:

        safe_limit = max(1, min(limit, 100))
        safe_history_limit = max(1, min(history_limit, 20))

        statement = (
            select(Match)
            .options(
                joinedload(Match.home_team),
                joinedload(Match.away_team),
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(safe_limit)
        )

        matches = list(
            self.db.scalars(statement).unique().all()
        )

        prediction_service = PredictionV11Service(
            db=self.db,
        )

        predictions = []
        errors = []
        detected_engine_version = None

        for match in matches:
            try:
                result = prediction_service.predict_match(
                    match_id=match.id,
                    history_limit=safe_history_limit,
                    max_goals=self.max_goals,
                    top_scores_count=self.top_scores_count,
                )

                mapped = PredictionMapperV11.to_latest(result)

                compatibility = self.build_home_compatibility(
                    match=match,
                    mapped=mapped,
                    result=result,
                )

                engine_version = str(
                    result.get(
                        "model",
                        "Prediction Engine V11 11.0.1",
                    )
                )

                if detected_engine_version is None:
                    detected_engine_version = engine_version

                predictions.append(
                    {
                        "api_version": "Latest Prediction API V1",
                        "engine_version": engine_version,
                        **mapped,
                        **compatibility,
                    }
                )

            except Exception as exc:
                errors.append(
                    {
                        "match_id": match.id,
                        "error": str(exc),
                    }
                )

        engine_version = (
            detected_engine_version
            or "Prediction Engine V11 11.0.1"
        )

        return {
            "status": "success",
            "api_version": "Latest Prediction API V1",
            "model_version": engine_version,
            "engine_version": engine_version,
            "configuration": {
                "limit": safe_limit,
                "history_limit": safe_history_limit,
                "max_goals": self.max_goals,
                "top_scores_count": self.top_scores_count,
            },
            "count": len(predictions),
            "failed_count": len(errors),
            "predictions": predictions,
            "errors": errors,
        }




