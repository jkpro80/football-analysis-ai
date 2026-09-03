from __future__ import annotations

from typing import Any
from sqlalchemy.orm import Session
from app.database.models import MatchOdd


class ValueBetService:
    MARKET_FULLTIME = 1
    MARKET_BTTS = 14
    MARKET_GOALS = 80

    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _probability(value: Any) -> float | None:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return None
        if number > 1:
            number /= 100.0
        return number if 0 <= number <= 1 else None

    @staticmethod
    def _canonical_label(market_id: int, label: str) -> str | None:
        value = str(label or "").strip().lower()
        if market_id == 1:
            if value in {"home", "1"}: return "Home"
            if value in {"draw", "x"}: return "Draw"
            if value in {"away", "2"}: return "Away"
        if market_id == 14:
            if value == "yes": return "Yes"
            if value == "no": return "No"
        if market_id == 80:
            if value == "over": return "Over"
            if value == "under": return "Under"
        return None

    def calculate(self, match_id: int, probabilities: dict[str, Any]) -> list[dict[str, Any]]:
        model = {(1, "Home"): self._probability(probabilities.get("home_win")), (1, "Draw"): self._probability(probabilities.get("draw")), (1, "Away"): self._probability(probabilities.get("away_win")), (14, "Yes"): self._probability(probabilities.get("btts")), (14, "No"): self._probability(probabilities.get("no_btts")), (80, "Over"): self._probability(probabilities.get("over_2_5")), (80, "Under"): self._probability(probabilities.get("under_2_5"))}
        rows = self.db.query(MatchOdd).filter(MatchOdd.match_id == int(match_id), MatchOdd.stopped.is_(False), MatchOdd.market_id.in_((1, 14, 80))).all()
        best: dict[tuple[int, str], MatchOdd] = {}
        for row in rows:
            if row.market_id == 80 and str(row.total or "").strip() != "2.5": continue
            label = self._canonical_label(int(row.market_id), str(row.label or row.selection_name or ""))
            if label is None or not row.decimal_odds or float(row.decimal_odds) <= 1: continue
            key = (int(row.market_id), label)
            if key not in best or float(row.decimal_odds) > float(best[key].decimal_odds): best[key] = row
        names = {1: "Fulltime Result", 14: "Both Teams To Score", 80: "Goals Over/Under 2.5"}
        result: list[dict[str, Any]] = []
        for key, probability in model.items():
            if probability is None or key not in best: continue
            odd = best[key]; price = float(odd.decimal_odds); market_probability = 1.0 / price; edge = probability - market_probability; ev = probability * price - 1.0
            if ev <= 0: continue
            result.append({"match_id": int(match_id), "market_id": key[0], "market": names[key[0]], "selection": key[1], "model_probability": round(probability * 100, 2), "market_probability": round(market_probability * 100, 2), "edge": round(edge * 100, 2), "expected_value": round(ev * 100, 2), "best_odds": round(price, 3), "bookmaker": odd.bookmaker_name, "provider_odd_id": odd.provider_odd_id})
        result.sort(key=lambda item: (item["expected_value"], item["edge"]), reverse=True)
        return result


    def calculate_upcoming(self, limit: int = 100) -> list[dict[str, Any]]:
        from datetime import datetime, timezone
        from sqlalchemy import func
        from sqlalchemy.orm import joinedload
        from app.database.models import Match, PredictionRecord

        latest_ids = (
            self.db.query(func.max(PredictionRecord.id).label("prediction_id"))
            .join(Match, Match.id == PredictionRecord.match_id)
            .filter(Match.date >= datetime.now(timezone.utc), Match.status.in_(("1", "scheduled", "ns")))
            .group_by(PredictionRecord.match_id)
            .subquery()
        )
        records = (
            self.db.query(PredictionRecord)
            .join(latest_ids, PredictionRecord.id == latest_ids.c.prediction_id)
            .options(joinedload(PredictionRecord.match).joinedload(Match.home_team), joinedload(PredictionRecord.match).joinedload(Match.away_team))
            .order_by(PredictionRecord.created_at.desc())
            .limit(max(1, min(int(limit), 200)))
            .all()
        )
        opportunities: list[dict[str, Any]] = []
        for record in records:
            match = record.match
            if match is None or match.home_team is None or match.away_team is None:
                continue
            over = self._probability(record.over_2_5_probability)
            btts = self._probability(record.btts_probability)
            probabilities = {
                "home_win": record.home_win_probability,
                "draw": record.draw_probability,
                "away_win": record.away_win_probability,
                "over_2_5": over,
                "under_2_5": None if over is None else 1.0 - over,
                "btts": btts,
                "no_btts": None if btts is None else 1.0 - btts,
            }
            for item in self.calculate(match.id, probabilities):
                item.update({
                    "match_date": match.date.isoformat(),
                    "home_team": {"id": match.home_team.id, "name": match.home_team.name, "logo_url": match.home_team.logo_url},
                    "away_team": {"id": match.away_team.id, "name": match.away_team.name, "logo_url": match.away_team.logo_url},
                    "model_version": record.model_version,
                })
                opportunities.append(item)
        opportunities.sort(key=lambda item: (item["expected_value"], item["edge"]), reverse=True)
        return opportunities
