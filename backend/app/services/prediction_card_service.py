from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.database.models import (
    Match,
    PredictionCard,
    PredictionCardItem,
    PredictionRecord,
    User,
)


class PredictionCardServiceError(Exception):
    """Base prediction-card service error."""


class PredictionCardNotFoundError(PredictionCardServiceError):
    """Raised when a prediction card cannot be found."""


class PredictionCardValidationError(PredictionCardServiceError):
    """Raised when prediction-card input is invalid."""


class PredictionCardItemNotFoundError(PredictionCardServiceError):
    """Raised when a prediction-card item cannot be found."""


class PredictionCardService:
    CARD_NUMBER_PREFIX = "MLX"

    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")

        self.db = db

    def create_card(
        self,
        *,
        user: User,
        title: str | None = None,
    ) -> PredictionCard:
        if user is None or user.id is None:
            raise PredictionCardValidationError(
                "A persisted user is required."
            )

        normalized_title = self._normalize_title(title)

        card = PredictionCard(
            user_id=user.id,
            card_number=self._temporary_card_number(
                user_id=user.id
            ),
            title=normalized_title,
            status="draft",
        )

        self.db.add(card)
        self.db.flush()

        card.card_number = self._build_card_number(
            card_id=card.id
        )

        self.db.commit()
        self.db.refresh(card)

        return card

    def list_cards(
        self,
        *,
        user: User,
    ) -> list[PredictionCard]:
        if user is None or user.id is None:
            raise PredictionCardValidationError(
                "A persisted user is required."
            )

        return (
            self.db.query(PredictionCard)
            .options(
                selectinload(PredictionCard.items)
            )
            .filter(
                PredictionCard.user_id == user.id
            )
            .order_by(
                PredictionCard.created_at.desc(),
                PredictionCard.id.desc(),
            )
            .all()
        )

    def get_card(
        self,
        *,
        user: User,
        card_id: int,
    ) -> PredictionCard:
        if user is None or user.id is None:
            raise PredictionCardValidationError(
                "A persisted user is required."
            )

        if card_id <= 0:
            raise PredictionCardValidationError(
                "card_id must be greater than zero."
            )

        card = (
            self.db.query(PredictionCard)
            .options(
                selectinload(PredictionCard.items)
            )
            .filter(
                PredictionCard.id == card_id,
                PredictionCard.user_id == user.id,
            )
            .first()
        )

        if card is None:
            raise PredictionCardNotFoundError(
                "Prediction card not found."
            )

        return card

    def add_item(
        self,
        *,
        user: User,
        card_id: int,
        match_id: int,
        market: str,
        selection: str,
        line: float | None = None,
    ) -> PredictionCardItem:
        card = self.get_card(
            user=user,
            card_id=card_id,
        )

        if match_id <= 0:
            raise PredictionCardValidationError(
                "match_id must be greater than zero."
            )

        normalized_market = (
            market.strip().lower()
            if market is not None
            else ""
        )
        normalized_selection = (
            selection.strip().lower()
            if selection is not None
            else ""
        )

        supported = {
            "1x2": {
                "home",
                "draw",
                "away",
            },
            "goals_2_5": {
                "over",
                "under",
            },
            "btts": {
                "yes",
                "no",
            },
            "corners_total": {
                "over",
                "under",
            },
            "corners_home": {
                "over",
                "under",
            },
            "corners_away": {
                "over",
                "under",
            },
        }

        if normalized_market not in supported:
            raise PredictionCardValidationError(
                "Unsupported prediction-card market."
            )

        if (
            normalized_selection
            not in supported[normalized_market]
        ):
            raise PredictionCardValidationError(
                "Unsupported selection for this market."
            )

        normalized_line: float | None = None

        if normalized_market in {
            "corners_total",
            "corners_home",
            "corners_away",
        }:
            if line is None:
                raise PredictionCardValidationError(
                    "line is required for corners markets."
                )

            try:
                normalized_line = float(line)
            except (TypeError, ValueError):
                raise PredictionCardValidationError(
                    "Invalid corners line."
                )

            if normalized_market == "corners_total":
                allowed_corner_lines = {
                    7.5,
                    8.5,
                    9.5,
                    10.5,
                    11.5,
                }
            else:
                allowed_corner_lines = {
                    1.5,
                    2.5,
                    3.5,
                    4.5,
                    5.5,
                    6.5,
                    7.5,
                }

            if normalized_line not in allowed_corner_lines:
                raise PredictionCardValidationError(
                    "Unsupported corners line."
                )

        elif line is not None:
            raise PredictionCardValidationError(
                "line is not supported for this market."
            )

        record = (
            self.db.query(PredictionRecord)
            .filter(
                PredictionRecord.match_id == match_id
            )
            .order_by(
                PredictionRecord.created_at.desc(),
                PredictionRecord.id.desc(),
            )
            .first()
        )

        if record is None:
            raise PredictionCardValidationError(
                "No prediction record exists for this match."
            )

        probability = self._market_probability(
            record=record,
            market=normalized_market,
            selection=normalized_selection,
            line=normalized_line,
        )

        effective_line = (
            normalized_line
            if normalized_market in {
                "corners_total",
                "corners_home",
                "corners_away",
            }
            else (
                2.5
                if normalized_market == "goals_2_5"
                else None
            )
        )

        existing_query = (
            self.db.query(PredictionCardItem)
            .filter(
                PredictionCardItem.card_id == card.id,
                PredictionCardItem.match_id == match_id,
                PredictionCardItem.market
                == normalized_market,
                PredictionCardItem.selection
                == normalized_selection,
            )
        )

        if effective_line is None:
            existing_query = existing_query.filter(
                PredictionCardItem.line.is_(None)
            )
        else:
            existing_query = existing_query.filter(
                PredictionCardItem.line == effective_line
            )

        existing = existing_query.first()

        if existing is not None:
            raise PredictionCardValidationError(
                "This selection already exists in the card."
            )

        item = PredictionCardItem(
            card_id=card.id,
            match_id=match_id,
            prediction_record_id=record.id,
            market=normalized_market,
            selection=normalized_selection,
            line=effective_line,
            expected_value=(
                record.expected_total_goals
                if normalized_market == "goals_2_5"
                else (
                    record.expected_total_corners
                    if normalized_market == "corners_total"
                    else (
                        record.expected_home_corners
                        if normalized_market == "corners_home"
                        else (
                            record.expected_away_corners
                            if normalized_market == "corners_away"
                            else None
                        )
                    )
                )
            ),
            probability=probability,
            confidence=self._normalize_confidence(
                record.confidence_score
            ),
            model_version=record.model_version,
        )

        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)

        return item

    def recommend_match_pick(
        self,
        *,
        match_id: int,
    ) -> dict[str, Any]:
        """
        Return the strongest supported prediction-card selection
        for the latest prediction record of one match.

        This method does not run Prediction Engine V11 again.
        It ranks probabilities already persisted in PredictionRecord.
        """
        if match_id <= 0:
            raise PredictionCardValidationError(
                "match_id must be greater than zero."
            )

        record = (
            self.db.query(PredictionRecord)
            .filter(
                PredictionRecord.match_id == match_id
            )
            .order_by(
                PredictionRecord.created_at.desc(),
                PredictionRecord.id.desc(),
            )
            .first()
        )

        if record is None:
            raise PredictionCardValidationError(
                "No prediction record exists for this match."
            )

        candidates: list[dict[str, Any]] = []

        def add_candidate(
            market: str,
            selection: str,
            line: float | None = None,
        ) -> None:
            try:
                probability = self._market_probability(
                    record=record,
                    market=market,
                    selection=selection,
                    line=line,
                )
            except PredictionCardValidationError:
                return

            candidates.append(
                {
                    "market": market,
                    "selection": selection,
                    "line": line,
                    "probability": probability,
                }
            )

        # 1X2
        for selection in ("home", "draw", "away"):
            add_candidate(
                "1x2",
                selection,
            )

        # Goals 2.5
        for selection in ("over", "under"):
            add_candidate(
                "goals_2_5",
                selection,
            )

        # Both teams to score
        for selection in ("yes", "no"):
            add_candidate(
                "btts",
                selection,
            )

        # Total corners
        for line in (7.5, 8.5, 9.5, 10.5, 11.5):
            for selection in ("over", "under"):
                add_candidate(
                    "corners_total",
                    selection,
                    line,
                )

        # Home / away team corners
        for market in (
            "corners_home",
            "corners_away",
        ):
            for line in (
                1.5,
                2.5,
                3.5,
                4.5,
                5.5,
                6.5,
                7.5,
            ):
                for selection in ("over", "under"):
                    add_candidate(
                        market,
                        selection,
                        line,
                    )

        if not candidates:
            raise PredictionCardValidationError(
                "No supported prediction-card probabilities "
                "are available for this match."
            )

        candidates.sort(
            key=lambda item: item["probability"],
            reverse=True,
        )

        best = candidates[0]

        return {
            **best,
            "match_id": match_id,
            "prediction_record_id": record.id,
            "confidence": self._normalize_confidence(
                record.confidence_score
            ),
            "model_version": record.model_version,
            "alternatives": candidates,
        }
    def recommend_matches(
        self,
        *,
        match_ids: list[int],
        count: int,
        min_probability: float = 0.60,
        max_probability: float = 0.90,
    ) -> list[dict[str, Any]]:
        """
        Rank matches by their strongest eligible prediction-card pick.

        One selection is returned per match. Extremely low-confidence
        and near-certain edge selections are excluded from automatic
        ranking, while remaining available as manual alternatives.
        """
        if count <= 0:
            raise PredictionCardValidationError(
                "count must be greater than zero."
            )

        if not 0.0 <= min_probability <= 1.0:
            raise PredictionCardValidationError(
                "min_probability must be between 0 and 1."
            )

        if not 0.0 <= max_probability <= 1.0:
            raise PredictionCardValidationError(
                "max_probability must be between 0 and 1."
            )

        if min_probability > max_probability:
            raise PredictionCardValidationError(
                "min_probability cannot exceed max_probability."
            )

        unique_match_ids: list[int] = []
        seen: set[int] = set()

        for raw_match_id in match_ids:
            try:
                match_id = int(raw_match_id)
            except (TypeError, ValueError):
                continue

            if match_id <= 0 or match_id in seen:
                continue

            seen.add(match_id)
            unique_match_ids.append(match_id)

        ranked: list[dict[str, Any]] = []

        for match_id in unique_match_ids:
            try:
                recommendation = self.recommend_match_pick(
                    match_id=match_id
                )
            except PredictionCardValidationError:
                continue

            alternatives = recommendation.get(
                "alternatives",
                [],
            )

            auto_corner_lines = {
                "corners_total": (8.5, 9.5, 10.5),
                "corners_home": (3.5, 4.5, 5.5),
                "corners_away": (3.5, 4.5, 5.5),
            }

            record = (
                self.db.query(PredictionRecord)
                .filter(
                    PredictionRecord.id
                    == recommendation["prediction_record_id"]
                )
                .first()
            )

            if record is None:
                continue

            expected_corner_values = {
                "corners_total": record.expected_total_corners,
                "corners_home": record.expected_home_corners,
                "corners_away": record.expected_away_corners,
            }

            auto_corner_reference_lines = {}

            for market, lines in auto_corner_lines.items():
                expected_value = expected_corner_values[
                    market
                ]

                if expected_value is None:
                    continue

                auto_corner_reference_lines[market] = min(
                    lines,
                    key=lambda line: abs(
                        float(line)
                        - float(expected_value)
                    ),
                )

            eligible = []

            for candidate in alternatives:
                probability = float(
                    candidate["probability"]
                )

                if not (
                    min_probability
                    <= probability
                    <= max_probability
                ):
                    continue

                market = str(
                    candidate["market"]
                )

                if market in auto_corner_lines:
                    line = candidate.get("line")

                    if line is None:
                        continue

                    reference_line = (
                        auto_corner_reference_lines.get(
                            market
                        )
                    )

                    if reference_line is None:
                        continue

                    if float(line) != float(
                        reference_line
                    ):
                        continue

                eligible.append(candidate)

            if not eligible:
                continue

            eligible.sort(
                key=lambda item: float(
                    item["probability"]
                ),
                reverse=True,
            )

            best = eligible[0]

            ranked.append(
                {
                    "match_id": match_id,
                    "prediction_record_id": recommendation[
                        "prediction_record_id"
                    ],
                    "market": best["market"],
                    "selection": best["selection"],
                    "line": best["line"],
                    "probability": float(
                        best["probability"]
                    ),
                    "confidence": recommendation.get(
                        "confidence"
                    ),
                    "model_version": recommendation.get(
                        "model_version"
                    ),
                    "alternatives": alternatives,
                }
            )

        ranked.sort(
            key=lambda item: (
                float(item["confidence"] or 0.0),
                float(item["probability"]),
            ),
            reverse=True,
        )

        return ranked[:count]
    def generate_card(
        self,
        *,
        user: User,
        count: int,
        title: str | None = None,
        pool_size: int = 100,
        min_probability: float = 0.60,
        max_probability: float = 0.90,
    ) -> PredictionCard:
        """
        Generate one automatic prediction card from upcoming matches.

        The strongest eligible selection is chosen for each match.
        The whole card is persisted with one final commit.
        """
        if user is None or user.id is None:
            raise PredictionCardValidationError(
                "A persisted user is required."
            )

        if not 1 <= count <= 15:
            raise PredictionCardValidationError(
                "count must be between 1 and 15."
            )

        if pool_size < count:
            raise PredictionCardValidationError(
                "pool_size cannot be smaller than count."
            )

        if pool_size > 500:
            raise PredictionCardValidationError(
                "pool_size cannot exceed 500."
            )

        if not 0.0 <= min_probability <= 1.0:
            raise PredictionCardValidationError(
                "min_probability must be between 0 and 1."
            )

        if not 0.0 <= max_probability <= 1.0:
            raise PredictionCardValidationError(
                "max_probability must be between 0 and 1."
            )

        if min_probability > max_probability:
            raise PredictionCardValidationError(
                "min_probability cannot exceed max_probability."
            )

        now = datetime.now(timezone.utc).replace(
            tzinfo=None
        )

        finished_statuses = {
            "finished",
            "ft",
            "after extra time",
            "after penalties",
            "cancelled",
            "canceled",
            "postponed",
            "abandoned",
        }

        matches = (
            self.db.query(Match)
            .filter(
                Match.date >= now
            )
            .order_by(
                Match.date.asc(),
                Match.id.asc(),
            )
            .limit(pool_size)
            .all()
        )

        upcoming_matches = [
            match
            for match in matches
            if (
                str(match.status or "")
                .strip()
                .lower()
                not in finished_statuses
            )
        ]

        if not upcoming_matches:
            raise PredictionCardValidationError(
                "No upcoming matches are available."
            )

        recommendations = self.recommend_matches(
            match_ids=[
                match.id
                for match in upcoming_matches
            ],
            count=count,
            min_probability=min_probability,
            max_probability=max_probability,
        )

        if len(recommendations) < count:
            raise PredictionCardValidationError(
                "Not enough eligible upcoming predictions "
                f"were found for a {count}-match card."
            )

        normalized_title = self._normalize_title(
            title
        )

        try:
            card = PredictionCard(
                user_id=user.id,
                card_number=self._temporary_card_number(
                    user_id=user.id
                ),
                title=normalized_title,
                status="draft",
            )

            self.db.add(card)
            self.db.flush()

            card.card_number = self._build_card_number(
                card_id=card.id
            )

            for recommendation in recommendations:
                market = str(
                    recommendation["market"]
                )

                selection = str(
                    recommendation["selection"]
                )

                line = recommendation.get(
                    "line"
                )

                probability = float(
                    recommendation["probability"]
                )

                match_id = int(
                    recommendation["match_id"]
                )

                prediction_record_id = int(
                    recommendation[
                        "prediction_record_id"
                    ]
                )

                record = (
                    self.db.query(PredictionRecord)
                    .filter(
                        PredictionRecord.id
                        == prediction_record_id
                    )
                    .first()
                )

                if record is None:
                    raise PredictionCardValidationError(
                        "Prediction record disappeared "
                        "while generating the card."
                    )

                effective_line = (
                    float(line)
                    if line is not None
                    else (
                        2.5
                        if market == "goals_2_5"
                        else None
                    )
                )

                expected_value = None

                if market == "goals_2_5":
                    expected_value = (
                        record.expected_total_goals
                    )

                elif market == "corners_total":
                    expected_value = (
                        record.expected_total_corners
                    )

                elif market == "corners_home":
                    expected_value = (
                        record.expected_home_corners
                    )

                elif market == "corners_away":
                    expected_value = (
                        record.expected_away_corners
                    )

                item = PredictionCardItem(
                    card_id=card.id,
                    match_id=match_id,
                    prediction_record_id=record.id,
                    market=market,
                    selection=selection,
                    line=effective_line,
                    expected_value=expected_value,
                    probability=probability,
                    confidence=self._normalize_confidence(
                        record.confidence_score
                    ),
                    model_version=record.model_version,
                )

                self.db.add(item)

            self.db.flush()
            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return self.get_card(
            user=user,
            card_id=card.id,
        )
    def remove_item(
        self,
        *,
        user: User,
        card_id: int,
        item_id: int,
    ) -> None:
        card = self.get_card(
            user=user,
            card_id=card_id,
        )

        if item_id <= 0:
            raise PredictionCardValidationError(
                "item_id must be greater than zero."
            )

        item = (
            self.db.query(PredictionCardItem)
            .filter(
                PredictionCardItem.id == item_id,
                PredictionCardItem.card_id == card.id,
            )
            .first()
        )

        if item is None:
            raise PredictionCardItemNotFoundError(
                "Prediction card item not found."
            )

        self.db.delete(item)
        self.db.commit()

    @staticmethod
    def _market_probability(
        *,
        record: PredictionRecord,
        market: str,
        selection: str,
        line: float | None = None,
    ) -> float:
        if market == "1x2":
            values = {
                "home": record.home_win_probability,
                "draw": record.draw_probability,
                "away": record.away_win_probability,
            }

            probability = values[selection]

        elif market == "goals_2_5":
            over_probability = float(
                record.over_2_5_probability
            )

            if over_probability > 1.0:
                over_probability = (
                    over_probability / 100.0
                )

            probability = (
                over_probability
                if selection == "over"
                else 1.0 - over_probability
            )

        elif market == "btts":
            yes_probability = float(
                record.btts_probability
            )

            if yes_probability > 1.0:
                yes_probability = (
                    yes_probability / 100.0
                )

            probability = (
                yes_probability
                if selection == "yes"
                else 1.0 - yes_probability
            )

        elif market in {
            "corners_total",
            "corners_home",
            "corners_away",
        }:
            if line is None:
                raise PredictionCardValidationError(
                    "line is required for corners markets."
                )

            expected_corners = {
                "corners_total": record.expected_total_corners,
                "corners_home": record.expected_home_corners,
                "corners_away": record.expected_away_corners,
            }[market]

            if expected_corners is None:
                raise PredictionCardValidationError(
                    "Expected corners are unavailable."
                )

            from app.engine.match_events_engine import (
                MatchEventsEngine,
            )

            over_probability = (
                MatchEventsEngine._probability_over(
                    mean=float(expected_corners),
                    line=float(line),
                )
            )

            probability = (
                over_probability
                if selection == "over"
                else 1.0 - over_probability
            )

        else:
            raise PredictionCardValidationError(
                "Unsupported prediction-card market."
            )

        if probability is None:
            raise PredictionCardValidationError(
                "Prediction probability is unavailable."
            )

        probability = float(probability)

        if probability < 0.0:
            raise PredictionCardValidationError(
                "Prediction probability is invalid."
            )

        if probability > 1.0:
            if probability <= 100.0:
                probability = probability / 100.0
            else:
                raise PredictionCardValidationError(
                    "Prediction probability is invalid."
                )

        return probability

    @staticmethod
    def _normalize_confidence(
        value: int | float | None,
    ) -> float | None:
        if value is None:
            return None

        score = float(value)

        if score < 0.0:
            return 0.0

        if score > 100.0:
            return 1.0

        return score / 100.0
    def delete_card(
        self,
        *,
        user: User,
        card_id: int,
    ) -> None:
        card = self.get_card(
            user=user,
            card_id=card_id,
        )

        self.db.delete(card)
        self.db.commit()

    @staticmethod
    def _team_name(
        team: Any,
    ) -> str | None:
        if team is None:
            return None

        value = getattr(
            team,
            "name",
            None,
        )

        if value is None:
            return None

        return str(value)

    @classmethod
    def _evaluate_card_item(
        cls,
        item: PredictionCardItem,
    ) -> dict[str, Any]:
        match = item.match

        if match is None:
            return {
                "evaluation_status": "pending",
                "is_correct": None,
                "actual_result": None,
                "actual_value": None,
                "home_score": None,
                "away_score": None,
            }

        home_score = getattr(
            match,
            "home_score",
            None,
        )
        away_score = getattr(
            match,
            "away_score",
            None,
        )

        market = str(
            item.market or ""
        ).strip().lower()

        selection = str(
            item.selection or ""
        ).strip().lower()

        line = (
            float(item.line)
            if item.line is not None
            else None
        )

        actual_result: str | None = None
        actual_value: float | None = None
        is_correct: bool | None = None

        # ----------------------------------------------------
        # Match result
        # ----------------------------------------------------

        if market == "1x2":
            if (
                home_score is None
                or away_score is None
            ):
                pass
            else:
                home_score = int(home_score)
                away_score = int(away_score)

                if home_score > away_score:
                    actual_result = "home"
                elif home_score < away_score:
                    actual_result = "away"
                else:
                    actual_result = "draw"

                is_correct = (
                    selection == actual_result
                )

        # ----------------------------------------------------
        # Goals O/U 2.5
        # ----------------------------------------------------

        elif market == "goals_2_5":
            if (
                home_score is None
                or away_score is None
            ):
                pass
            else:
                total_goals = (
                    int(home_score)
                    + int(away_score)
                )

                actual_value = float(
                    total_goals
                )

                actual_result = (
                    "over"
                    if total_goals > 2.5
                    else "under"
                )

                is_correct = (
                    selection == actual_result
                )

        # ----------------------------------------------------
        # BTTS
        # ----------------------------------------------------

        elif market == "btts":
            if (
                home_score is None
                or away_score is None
            ):
                pass
            else:
                actual_result = (
                    "yes"
                    if (
                        int(home_score) > 0
                        and int(away_score) > 0
                    )
                    else "no"
                )

                is_correct = (
                    selection == actual_result
                )

        # ----------------------------------------------------
        # Corners
        # ----------------------------------------------------

        elif market in {
            "corners_total",
            "corners_home",
            "corners_away",
        }:
            home_corners = getattr(
                match,
                "home_corners",
                None,
            )

            away_corners = getattr(
                match,
                "away_corners",
                None,
            )

            if market == "corners_home":
                value = home_corners

            elif market == "corners_away":
                value = away_corners

            else:
                value = (
                    (
                        float(home_corners)
                        + float(away_corners)
                    )
                    if (
                        home_corners is not None
                        and away_corners is not None
                    )
                    else None
                )

            if (
                value is not None
                and line is not None
            ):
                actual_value = float(value)

                if actual_value > line:
                    actual_result = "over"

                elif actual_value < line:
                    actual_result = "under"

                else:
                    actual_result = "push"

                if actual_result == "push":
                    is_correct = None
                else:
                    is_correct = (
                        selection
                        == actual_result
                    )

        if is_correct is True:
            evaluation_status = "won"

        elif is_correct is False:
            evaluation_status = "lost"

        else:
            evaluation_status = "pending"

        return {
            "evaluation_status": (
                evaluation_status
            ),
            "is_correct": is_correct,
            "actual_result": actual_result,
            "actual_value": actual_value,
            "home_score": home_score,
            "away_score": away_score,
        }

    @classmethod
    def serialize_card(
        cls,
        card: PredictionCard,
    ) -> dict[str, Any]:
        items = [
            cls.serialize_item(item)
            for item in (card.items or [])
        ]

        if (
            items
            and all(
                item["is_correct"] is True
                for item in items
            )
        ):
            computed_status = "won"

        elif any(
            item["is_correct"] is False
            for item in items
        ):
            computed_status = "lost"

        else:
            computed_status = "pending"

        resolved_count = sum(
            1
            for item in items
            if item["is_correct"] is not None
        )

        won_count = sum(
            1
            for item in items
            if item["is_correct"] is True
        )

        lost_count = sum(
            1
            for item in items
            if item["is_correct"] is False
        )

        return {
            "id": card.id,
            "card_number": card.card_number,
            "title": card.title,
            "status": computed_status,
            "created_at": cls._iso(
                card.created_at
            ),
            "updated_at": cls._iso(
                card.updated_at
            ),
            "items_count": len(items),
            "resolved_count": resolved_count,
            "won_count": won_count,
            "lost_count": lost_count,
            "items": items,
        }

    @classmethod
    def serialize_item(
        cls,
        item: PredictionCardItem,
    ) -> dict[str, Any]:
        match = item.match

        evaluation = (
            cls._evaluate_card_item(item)
        )

        home_team = (
            getattr(
                match,
                "home_team",
                None,
            )
            if match is not None
            else None
        )

        away_team = (
            getattr(
                match,
                "away_team",
                None,
            )
            if match is not None
            else None
        )

        return {
            "id": item.id,
            "match_id": item.match_id,
            "prediction_record_id": (
                item.prediction_record_id
            ),
            "home_team": cls._team_name(
                home_team
            ),
            "away_team": cls._team_name(
                away_team
            ),
            "match_status": (
                str(
                    getattr(
                        match,
                        "status",
                        "",
                    )
                )
                if match is not None
                else None
            ),
            "market": item.market,
            "selection": item.selection,
            "line": item.line,
            "expected_value": (
                item.expected_value
            ),
            "probability": (
                item.probability
            ),
            "confidence": (
                item.confidence
            ),
            "model_version": (
                item.model_version
            ),
            "home_score": evaluation[
                "home_score"
            ],
            "away_score": evaluation[
                "away_score"
            ],
            "actual_result": evaluation[
                "actual_result"
            ],
            "actual_value": evaluation[
                "actual_value"
            ],
            "evaluation_status": evaluation[
                "evaluation_status"
            ],
            "is_correct": evaluation[
                "is_correct"
            ],
            "created_at": (
                item.created_at.isoformat()
                if item.created_at is not None
                else None
            ),
        }

    @staticmethod
    def _normalize_title(
        title: str | None,
    ) -> str | None:
        if title is None:
            return None

        normalized = title.strip()

        if not normalized:
            return None

        if len(normalized) > 200:
            raise PredictionCardValidationError(
                "Card title cannot exceed 200 characters."
            )

        return normalized

    @classmethod
    def _build_card_number(
        cls,
        *,
        card_id: int,
    ) -> str:
        return f"{cls.CARD_NUMBER_PREFIX}-{card_id:06d}"

    @staticmethod
    def _temporary_card_number(
        *,
        user_id: int,
    ) -> str:
        now = datetime.now(timezone.utc)

        return (
            f"TMP-{user_id}-"
            f"{now.strftime('%Y%m%d%H%M%S%f')}"
        )

    @staticmethod
    def _iso(
        value: datetime | None,
    ) -> str | None:
        if value is None:
            return None

        return value.isoformat()
