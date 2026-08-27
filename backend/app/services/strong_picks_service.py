from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.database.models import Match, StrongPick, PredictionRecord
from app.services.prediction_v11_upcoming_service import (
    PredictionV11UpcomingService,
)


class StrongPicksService:
    """
    Premium Strong Picks selection layer.

    This service does not generate predictions itself.
    It consumes Prediction V11 upcoming results and selects
    the strongest available picks across upcoming matches.
    """

    MIN_COUNT = 2
    MAX_COUNT = 10
    DEFAULT_MIN_PROBABILITY = 0.70
    DEFAULT_MIN_CONFIDENCE = 0.75

    def __init__(
        self,
        db: Session,
        *,
        max_goals: int = 8,
        top_scores_count: int = 10,
    ) -> None:
        if db is None:
            raise ValueError("Database session is required.")

        self.db = db
        self.upcoming_service = PredictionV11UpcomingService(
            db=db,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
        )

    def build_card(
        self,
        *,
        count: int,
        scan_limit: int = 50,
        history_limit: int = 5,
        min_probability: float = DEFAULT_MIN_PROBABILITY,
        min_confidence: float = DEFAULT_MIN_CONFIDENCE,
    ) -> dict[str, Any]:
        requested_count = self._validate_count(count)
        threshold = self._validate_probability(min_probability)
        confidence_threshold = self._validate_probability(min_confidence)

        upcoming = self.upcoming_service.get_upcoming_predictions(
            limit=scan_limit,
            history_limit=history_limit,
        )

        predictions = upcoming.get("predictions", [])

        if not isinstance(predictions, list):
            predictions = []

        candidates: list[dict[str, Any]] = []

        for prediction in predictions:
            candidate = self._candidate_from_prediction(prediction)

            if candidate is None:
                continue

            if candidate["probability"] < threshold:
                continue

            confidence_score = candidate.get("confidence_score")

            if (
                confidence_score is None
                or confidence_score < confidence_threshold
            ):
                continue

            candidates.append(candidate)

        candidates.sort(
            key=lambda item: (
                item["ranking_score"],
                item["probability"],
            ),
            reverse=True,
        )

        selected = self._select_distinct_matches(
            candidates=candidates,
            count=requested_count,
        )

        self._persist_selected_picks(
            selected,
        )

        average_probability = (
            round(
                sum(item["probability"] for item in selected)
                / len(selected),
                4,
            )
            if selected
            else None
        )

        return {
            "success": True,
            "feature": "premium_strong_picks",
            "requested_count": requested_count,
            "selected_count": len(selected),
            "complete": len(selected) == requested_count,
            "min_probability": threshold,
            "min_confidence": confidence_threshold,
            "average_probability": average_probability,
            "picks": selected,
            "message": self._build_message(
                requested=requested_count,
                selected=len(selected),
            ),
        }

    def _persist_selected_picks(
        self,
        selected: list[dict[str, Any]],
    ) -> None:
        for candidate in selected:
            match_id = candidate.get("match_id")
            prediction_record_id = candidate.get(
                "prediction_record_id"
            )

            if match_id is None:
                continue

            # Always resolve the PredictionRecord against the actual match.
            # A candidate may carry a stale/wrong prediction_record_id.
            prediction_record = None

            if prediction_record_id is not None:
                prediction_record = (
                    self.db.query(PredictionRecord)
                    .filter(
                        PredictionRecord.id == prediction_record_id,
                        PredictionRecord.match_id == match_id,
                    )
                    .first()
                )

            if prediction_record is None:
                prediction_record = (
                    self.db.query(PredictionRecord)
                    .filter(
                        PredictionRecord.match_id == match_id,
                    )
                    .first()
                )

            if prediction_record is None:
                continue

            prediction_record_id = prediction_record.id
            candidate["prediction_record_id"] = prediction_record_id

            strong_pick = (
                self.db.query(StrongPick)
                .filter(
                    StrongPick.match_id == match_id,
                )
                .first()
            )

            if strong_pick is None:
                strong_pick = StrongPick(
                    match_id=match_id,
                    prediction_record_id=prediction_record_id,
                    market=candidate["market"],
                    selection=candidate["selection"],
                    probability=candidate["probability"],
                    confidence=(
                        candidate["confidence_score"]
                        if candidate["confidence_score"] is not None
                        else candidate["probability"]
                    ),
                    strength_score=candidate["ranking_score"],
                    status="pending",
                )

                self.db.add(strong_pick)

            elif strong_pick.status == "pending":
                strong_pick.prediction_record_id = prediction_record_id
                strong_pick.market = candidate["market"]
                strong_pick.selection = candidate["selection"]
                strong_pick.probability = candidate["probability"]
                strong_pick.confidence = (
                    candidate["confidence_score"]
                    if candidate["confidence_score"] is not None
                    else candidate["probability"]
                )
                strong_pick.strength_score = candidate["ranking_score"]

        self.db.commit()
    def evaluate_pending_pick(
        self,
        *,
        match_id: int,
    ) -> dict[str, Any] | None:
        """
        Evaluate the persisted Strong Pick for a finished match.
        """

        strong_pick = (
            self.db.query(StrongPick)
            .filter(
                StrongPick.match_id == match_id,
            )
            .first()
        )

        if strong_pick is None:
            return None

        if strong_pick.status != "pending":
            return {
                "strong_pick_id": strong_pick.id,
                "match_id": strong_pick.match_id,
                "status": strong_pick.status,
                "is_winner": strong_pick.is_winner,
                "already_evaluated": True,
            }

        match = (
            self.db.query(Match)
            .filter(
                Match.id == match_id,
            )
            .first()
        )

        if match is None:
            return None

        if str(match.status).strip().lower() not in {
            "5",
            "finished",
            "ft",
        }:
            return None

        if (
            match.home_score is None
            or match.away_score is None
        ):
            return None

        home_score = int(match.home_score)
        away_score = int(match.away_score)
        total_goals = home_score + away_score

        actual_result = (
            "home_win"
            if home_score > away_score
            else "away_win"
            if home_score < away_score
            else "draw"
        )

        market = str(
            strong_pick.market
        ).strip().lower()

        selection = str(
            strong_pick.selection
        ).strip().lower()

        is_winner: bool | None = None
        actual_value: float | None = None
        result_status = "lost"

        if market == "match_result":
            is_winner = actual_result == selection
            actual_value = 1.0 if is_winner else 0.0

        elif market == "double_chance":

            if selection == "home_or_draw_1x":
                is_winner = actual_result in {
                    "home_win",
                    "draw",
                }

            elif selection == "home_or_away_12":
                is_winner = actual_result in {
                    "home_win",
                    "away_win",
                }

            elif selection == "draw_or_away_x2":
                is_winner = actual_result in {
                    "draw",
                    "away_win",
                }

            else:
                return None

            actual_value = (
                1.0
                if is_winner
                else 0.0
            )

        elif market == "draw_no_bet":

            if actual_result == "draw":
                result_status = "void"
                is_winner = None

            elif selection == "home":
                is_winner = actual_result == "home_win"

            elif selection == "away":
                is_winner = actual_result == "away_win"

            else:
                return None

            actual_value = float(
                home_score - away_score
            )

        elif market == "btts":

            actual_value = (
                1.0
                if home_score > 0
                and away_score > 0
                else 0.0
            )

            if selection == "yes":
                is_winner = (
                    home_score > 0
                    and away_score > 0
                )

            elif selection == "no":
                is_winner = not (
                    home_score > 0
                    and away_score > 0
                )

            else:
                return None

        elif market.startswith("total_"):

            try:
                line = float(
                    market.removeprefix("total_")
                )
            except ValueError:
                return None

            actual_value = float(total_goals)

            if selection == "over":
                is_winner = total_goals > line

            elif selection == "under":
                is_winner = total_goals < line

            else:
                return None

        else:
            return None

        if result_status != "void":
            result_status = (
                "won"
                if is_winner is True
                else "lost"
            )

        strong_pick.actual_result = (
            f"{home_score}-{away_score}"
        )

        strong_pick.actual_value = actual_value
        strong_pick.is_winner = is_winner
        strong_pick.status = result_status

        strong_pick.evaluated_at = datetime.now(
            timezone.utc
        )

        try:
            self.db.commit()
            self.db.refresh(strong_pick)

        except Exception:
            self.db.rollback()
            raise

        return {
            "strong_pick_id": strong_pick.id,
            "match_id": strong_pick.match_id,
            "prediction_record_id": (
                strong_pick.prediction_record_id
            ),
            "market": strong_pick.market,
            "selection": strong_pick.selection,
            "probability": strong_pick.probability,
            "confidence": strong_pick.confidence,
            "strength_score": strong_pick.strength_score,
            "actual_result": strong_pick.actual_result,
            "actual_value": strong_pick.actual_value,
            "is_winner": strong_pick.is_winner,
            "status": strong_pick.status,
            "evaluated_at": (
                strong_pick.evaluated_at.isoformat()
                if strong_pick.evaluated_at
                else None
            ),
            "already_evaluated": False,
        }
    @classmethod
    def _candidate_from_prediction(
        cls,
        prediction: Any,
    ) -> dict[str, Any] | None:
        if not isinstance(prediction, dict):
            return None

        market_candidate = cls._best_market_candidate(prediction)

        if market_candidate is None:
            return None

        probability = market_candidate["probability"]

        confidence = prediction.get("confidence")
        confidence_score = cls._extract_confidence(confidence)

        ranking_score = cls._ranking_score(
            probability=probability,
            confidence=confidence_score,
        )

        match_data = prediction.get("match")
        if not isinstance(match_data, dict):
            match_data = {}

        fixture_data = prediction.get("fixture")
        if not isinstance(fixture_data, dict):
            fixture_data = {}

        league_data = prediction.get("league")
        if not isinstance(league_data, dict):
            league_data = {}

        teams_data = prediction.get("teams")
        if not isinstance(teams_data, dict):
            teams_data = {}

        home_data = teams_data.get("home")
        if not isinstance(home_data, dict):
            home_data = {}

        away_data = teams_data.get("away")
        if not isinstance(away_data, dict):
            away_data = {}

        return {
            "match_id": (
                match_data.get("id")
                or prediction.get("match_id")
                or fixture_data.get("id")
            ),
            "prediction_record_id": prediction.get(
                "prediction_record_id"
            ),
            "fixture_id": (
                fixture_data.get("id")
                or prediction.get("fixture_id")
            ),
            "sportmonks_id": fixture_data.get("sportmonks_id"),
            "date": (
                match_data.get("date")
                or prediction.get("date")
                or fixture_data.get("date")
            ),
            "home_team": (
                match_data.get("home_team")
                or prediction.get("home_team")
                or home_data.get("name")
            ),
            "away_team": (
                match_data.get("away_team")
                or prediction.get("away_team")
                or away_data.get("name")
            ),
            "league": (
                league_data.get("name")
                or prediction.get("league")
            ),
            "market": market_candidate["market"],
            "selection": market_candidate["selection"],
            "probability": round(probability, 4),
            "confidence": confidence,
            "confidence_score": confidence_score,
            "ranking_score": ranking_score,
        }

    @classmethod
    def _best_market_candidate(
        cls,
        prediction: dict[str, Any],
    ) -> dict[str, Any] | None:
        markets = prediction.get("markets")

        if not isinstance(markets, dict):
            return None

        candidates: list[dict[str, Any]] = []

        def add_candidate(
            market: str,
            selection: str,
            value: Any,
        ) -> None:
            probability = cls._number(value)

            if probability is None:
                return

            probability = cls._normalize_probability(probability)

            if probability is None:
                return

            candidates.append(
                {
                    "market": market,
                    "selection": selection,
                    "probability": probability,
                }
            )

        match_result = markets.get("match_result")
        if isinstance(match_result, dict):
            for selection in ("home_win", "draw", "away_win"):
                add_candidate(
                    "match_result",
                    selection,
                    match_result.get(selection),
                )

        double_chance = markets.get("double_chance")
        if isinstance(double_chance, dict):
            for selection in (
                "home_or_draw_1x",
                "home_or_away_12",
                "draw_or_away_x2",
            ):
                add_candidate(
                    "double_chance",
                    selection,
                    double_chance.get(selection),
                )

        draw_no_bet = markets.get("draw_no_bet")
        if isinstance(draw_no_bet, dict):
            for selection in ("home", "away"):
                add_candidate(
                    "draw_no_bet",
                    selection,
                    draw_no_bet.get(selection),
                )

        btts = markets.get("btts")
        if isinstance(btts, dict):
            for selection in ("yes", "no"):
                add_candidate(
                    "btts",
                    selection,
                    btts.get(selection),
                )

        totals = markets.get("totals")
        if isinstance(totals, dict):
            for line in ("1.5", "2.5", "3.5", "4.5"):
                total_market = totals.get(line)

                if not isinstance(total_market, dict):
                    continue

                add_candidate(
                    f"total_{line}",
                    "over",
                    total_market.get("over"),
                )
                add_candidate(
                    f"total_{line}",
                    "under",
                    total_market.get("under"),
                )

        if not candidates:
            return None

        return max(
            candidates,
            key=lambda item: item["probability"],
        )
    @classmethod
    def _select_distinct_matches(
        cls,
        *,
        candidates: list[dict[str, Any]],
        count: int,
    ) -> list[dict[str, Any]]:
        selected: list[dict[str, Any]] = []
        seen_matches: set[Any] = set()

        for candidate in candidates:
            match_key = (
                candidate.get("match_id")
                or candidate.get("fixture_id")
            )

            if match_key is None:
                continue

            if match_key in seen_matches:
                continue

            seen_matches.add(match_key)
            selected.append(candidate)

            if len(selected) >= count:
                break

        return selected

    @classmethod
    def _extract_confidence(
        cls,
        confidence: Any,
    ) -> float | None:
        if isinstance(confidence, dict):
            for key in (
                "confidence",
                "score",
                "highest_probability",
            ):
                value = cls._number(confidence.get(key))

                if value is not None:
                    return cls._normalize_probability(value)

        value = cls._number(confidence)

        if value is not None:
            return cls._normalize_probability(value)

        return None

    @staticmethod
    def _ranking_score(
        *,
        probability: float,
        confidence: float | None,
    ) -> float:
        if confidence is None:
            return round(probability, 6)

        return round(
            (probability * 0.80)
            + (confidence * 0.20),
            6,
        )

    @classmethod
    def _validate_count(cls, count: int) -> int:
        try:
            value = int(count)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Strong Picks count must be an integer."
            ) from exc

        if value < cls.MIN_COUNT or value > cls.MAX_COUNT:
            raise ValueError(
                f"Strong Picks count must be between "
                f"{cls.MIN_COUNT} and {cls.MAX_COUNT}."
            )

        return value

    @staticmethod
    def _validate_probability(value: float) -> float:
        try:
            probability = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Minimum probability must be numeric."
            ) from exc

        normalized = StrongPicksService._normalize_probability(
            probability
        )

        if normalized is None:
            raise ValueError(
                "Minimum probability must be between 0 and 1 "
                "or between 0 and 100."
            )

        return normalized

    @staticmethod
    def _normalize_probability(
        value: float,
    ) -> float | None:
        if value < 0:
            return None

        if value <= 1:
            return float(value)

        if value <= 100:
            return float(value) / 100.0

        return None

    @staticmethod
    def _number(value: Any) -> float | None:
        if isinstance(value, bool):
            return None

        if isinstance(value, (int, float)):
            return float(value)

        try:
            if value is not None:
                return float(value)
        except (TypeError, ValueError):
            pass

        return None

    @staticmethod
    def _build_message(
        *,
        requested: int,
        selected: int,
    ) -> str:
        if selected == requested:
            return (
                f"Strong Picks card generated with "
                f"{selected} qualified picks."
            )

        return (
            f"Only {selected} qualified picks were available "
            f"out of {requested} requested. "
            "Quality threshold was not reduced."
        )
