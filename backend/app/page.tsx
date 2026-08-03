from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database.models import Match
from app.engine.feature_engine import FeatureEngine
from app.services.prediction_v6_service import (
    PredictionV6Service,
)


class PredictionV6UpcomingService:
    """
    إنشاء توقعات المباريات القادمة بواسطة Prediction V6،
    ثم تحويل النتيجة إلى الهيكل الذي تتوقعه الصفحة الرئيسية.
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
    def _build_best_pick(
        result_probabilities: dict[str, float],
        btts: dict[str, float],
        totals: dict[str, Any],
    ) -> dict[str, Any]:
        """
        اختيار السوق صاحب أعلى احتمال لعرضه في بطاقة أفضل توقع.
        """

        candidates: list[dict[str, Any]] = [
            {
                "key": "home_win",
                "label": "فوز الفريق المضيف",
                "probability": float(
                    result_probabilities.get(
                        "home_win",
                        0,
                    )
                ),
            },
            {
                "key": "draw",
                "label": "التعادل",
                "probability": float(
                    result_probabilities.get(
                        "draw",
                        0,
                    )
                ),
            },
            {
                "key": "away_win",
                "label": "فوز الفريق الضيف",
                "probability": float(
                    result_probabilities.get(
                        "away_win",
                        0,
                    )
                ),
            },
            {
                "key": "btts_yes",
                "label": "تسجيل الفريقين",
                "probability": float(
                    btts.get(
                        "yes",
                        0,
                    )
                ),
            },
            {
                "key": "btts_no",
                "label": "عدم تسجيل الفريقين",
                "probability": float(
                    btts.get(
                        "no",
                        0,
                    )
                ),
            },
            {
                "key": "over_2_5",
                "label": "أكثر من 2.5 هدف",
                "probability": float(
                    totals.get(
                        "2.5",
                        {},
                    ).get(
                        "over",
                        0,
                    )
                ),
            },
            {
                "key": "under_2_5",
                "label": "أقل من 2.5 هدف",
                "probability": float(
                    totals.get(
                        "2.5",
                        {},
                    ).get(
                        "under",
                        0,
                    )
                ),
            },
        ]

        return max(
            candidates,
            key=lambda item: item["probability"],
        )

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

        feature_engine = FeatureEngine(
            db=self.db,
        )

        prediction_service = PredictionV6Service(
            feature_engine=feature_engine,
            max_goals=self.max_goals,
            top_scores_count=self.top_scores_count,
        )

        predictions: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        for match in matches:
            try:
                result = (
                    prediction_service.predict_match(
                        match_id=match.id,
                        history_limit=safe_history_limit,
                        max_goals=self.max_goals,
                        top_scores_count=(
                            self.top_scores_count
                        ),
                    )
                )

                prediction = result.get(
                    "prediction",
                    {},
                )

                markets = result.get(
                    "markets",
                    {},
                )

                features = result.get(
                    "features",
                    {},
                )

                home_features = features.get(
                    "home_team",
                    {},
                )

                away_features = features.get(
                    "away_team",
                    {},
                )

                match_result = markets.get(
                    "match_result",
                    {},
                )

                totals = markets.get(
                    "totals",
                    {},
                )

                btts = markets.get(
                    "btts",
                    {},
                )

                expected_goals = prediction.get(
                    "expected_goals",
                    {},
                )

                most_likely_score = prediction.get(
                    "most_likely_score",
                    {},
                )

                confidence = prediction.get(
                    "confidence",
                    {},
                )

                best_pick = self._build_best_pick(
                    result_probabilities=match_result,
                    btts=btts,
                    totals=totals,
                )

                home_team = match.home_team
                away_team = match.away_team

                predictions.append(
                    {
                        # لا يوجد PredictionRecord في V6،
                        # لذلك نستخدم رقم المباراة كمعرف ثابت.
                        "prediction_record_id": (
                            match.id
                        ),

                        "fixture": {
                            "id": match.id,
                            "sportmonks_id": (
                                match.sportmonks_id
                            ),
                            "date": match.date,
                            "status": (
                                match.status
                                or "scheduled"
                            ),
                        },

                        "teams": {
                            "home": {
                                "id": (
                                    home_team.id
                                    if home_team
                                    else match.home_team_id
                                ),
                                "name": (
                                    home_team.name
                                    if home_team
                                    else home_features.get(
                                        "name",
                                        "الفريق المضيف",
                                    )
                                ),
                                "country": (
                                    home_team.country
                                    if home_team
                                    else home_features.get(
                                        "country"
                                    )
                                ),
                                "logo_url": (
                                    home_team.logo_url
                                    if home_team
                                    else home_features.get(
                                        "logo_url"
                                    )
                                ),
                            },
                            "away": {
                                "id": (
                                    away_team.id
                                    if away_team
                                    else match.away_team_id
                                ),
                                "name": (
                                    away_team.name
                                    if away_team
                                    else away_features.get(
                                        "name",
                                        "الفريق الضيف",
                                    )
                                ),
                                "country": (
                                    away_team.country
                                    if away_team
                                    else away_features.get(
                                        "country"
                                    )
                                ),
                                "logo_url": (
                                    away_team.logo_url
                                    if away_team
                                    else away_features.get(
                                        "logo_url"
                                    )
                                ),
                            },
                        },

                        "expected_goals": {
                            "home": float(
                                expected_goals.get(
                                    "home_expected_goals",
                                    0,
                                )
                            ),
                            "away": float(
                                expected_goals.get(
                                    "away_expected_goals",
                                    0,
                                )
                            ),
                            "total": float(
                                expected_goals.get(
                                    "total_expected_goals",
                                    0,
                                )
                            ),
                        },

                        "probabilities": {
                            "home_win": float(
                                match_result.get(
                                    "home_win",
                                    0,
                                )
                            ),
                            "draw": float(
                                match_result.get(
                                    "draw",
                                    0,
                                )
                            ),
                            "away_win": float(
                                match_result.get(
                                    "away_win",
                                    0,
                                )
                            ),
                            "over_2_5": float(
                                totals.get(
                                    "2.5",
                                    {},
                                ).get(
                                    "over",
                                    0,
                                )
                            ),
                            "under_2_5": float(
                                totals.get(
                                    "2.5",
                                    {},
                                ).get(
                                    "under",
                                    0,
                                )
                            ),
                            "btts": float(
                                btts.get(
                                    "yes",
                                    0,
                                )
                            ),
                            "no_btts": float(
                                btts.get(
                                    "no",
                                    0,
                                )
                            ),
                        },

                        "predicted_score": (
                            most_likely_score.get(
                                "score"
                            )
                        ),

                        "best_pick": best_pick,

                        "confidence": {
                            "label": confidence.get(
                                "level",
                                "Unknown",
                            ),
                            "score": float(
                                confidence.get(
                                    "value",
                                    0,
                                )
                            ),
                        },

                        "model_version": (
                            "Prediction V6.0"
                        ),
                    }
                )

            except Exception as exc:
                errors.append(
                    {
                        "match_id": match.id,
                        "error": str(exc),
                    }
                )

        return {
            "status": "success",
            "model_version": "Prediction V6.0",
            "engine_version": "Prediction V6.0",
            "count": len(predictions),
            "failed_count": len(errors),
            "predictions": predictions,
            "errors": errors,
        }