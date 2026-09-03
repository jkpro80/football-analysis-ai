from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database.models import Match, MatchOdd
from app.services.sportmonks_service import SportmonksService


class OddsService:
    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")
        self.db = db

    @staticmethod
    def _parse_datetime(value: object) -> datetime | None:
        if not value:
            return None
        text = str(value).strip().replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return None

    @staticmethod
    def _probability(value: object) -> float | None:
        if value is None:
            return None
        try:
            return float(str(value).replace("%", "").strip())
        except (TypeError, ValueError):
            return None

    async def sync_upcoming(self, limit: int = 12) -> dict:
        from datetime import timedelta

        now = datetime.now(timezone.utc)

        matches = (
            self.db.query(Match)
            .filter(
                Match.sportmonks_id.isnot(None),
                Match.status.in_(("1", "scheduled", "ns")),
                Match.date >= now,
                Match.date <= now + timedelta(days=30),
            )
            .order_by(Match.date.asc())
            .limit(500)
            .all()
        )

        synced = 0
        skipped_fresh = 0
        failed = 0
        results = []

        for match in matches:
            if synced >= max(1, int(limit)):
                break

            latest = (
                self.db.query(MatchOdd.synced_at)
                .filter(MatchOdd.match_id == match.id)
                .order_by(MatchOdd.synced_at.desc())
                .first()
            )

            match_date = match.date
            if match_date.tzinfo is None:
                match_date = match_date.replace(tzinfo=timezone.utc)

            hours_to_kickoff = max(
                0.0,
                (match_date - now).total_seconds() / 3600.0,
            )

            if hours_to_kickoff <= 6:
                refresh_minutes = 15
            elif hours_to_kickoff <= 24:
                refresh_minutes = 60
            elif hours_to_kickoff <= 24 * 7:
                refresh_minutes = 360
            else:
                refresh_minutes = 1440

            freshness_candidates = []

            if latest and latest[0] is not None:
                latest_at = latest[0]
                if latest_at.tzinfo is None:
                    latest_at = latest_at.replace(tzinfo=timezone.utc)
                freshness_candidates.append(latest_at)

            if match.odds_last_attempt_at is not None:
                attempt_at = match.odds_last_attempt_at
                if attempt_at.tzinfo is None:
                    attempt_at = attempt_at.replace(tzinfo=timezone.utc)
                freshness_candidates.append(attempt_at)

            if freshness_candidates:
                latest_activity_at = max(freshness_candidates)
                age_minutes = (
                    now - latest_activity_at
                ).total_seconds() / 60.0

                if age_minutes < refresh_minutes:
                    skipped_fresh += 1
                    continue

            try:
                result = await self.sync_match(match.id)
                results.append(result)
                synced += 1
            except Exception as error:
                self.db.rollback()
                failed += 1
                results.append(
                    {
                        "match_id": match.id,
                        "error": f"{type(error).__name__}: {error}",
                    }
                )

        return {
            "candidates": len(matches),
            "synced": synced,
            "skipped_fresh": skipped_fresh,
            "failed": failed,
            "results": results,
        }

    async def sync_match(self, match_id: int) -> dict:
        match = self.db.query(Match).filter(Match.id == int(match_id)).first()
        if match is None:
            raise ValueError("Match not found.")
        if not match.sportmonks_id:
            raise ValueError("Match has no SportMonks fixture id.")

        rows = await SportmonksService().get_pre_match_odds(int(match.sportmonks_id))
        created = 0
        updated = 0
        skipped = 0
        now = datetime.now(timezone.utc)
        match.odds_last_attempt_at = now

        existing_rows = self.db.query(MatchOdd).filter(MatchOdd.match_id == match.id).all()
        existing = {row.provider_odd_id: row for row in existing_rows}
        for row in existing_rows:
            row.stopped = True

        for item in rows:
            try:
                provider_odd_id = int(item["id"])
                decimal_odds = float(item["value"])
                market_id = int(item["market_id"])
                bookmaker_id = int(item["bookmaker_id"])
            except (KeyError, TypeError, ValueError):
                skipped += 1
                continue

            market = item.get("market") or {}
            bookmaker = item.get("bookmaker") or {}
            odd = existing.get(provider_odd_id)
            if odd is None:
                odd = MatchOdd(
                    provider_odd_id=provider_odd_id,
                    match_id=match.id,
                    provider_fixture_id=int(match.sportmonks_id),
                    market_id=market_id,
                    bookmaker_id=bookmaker_id,
                    decimal_odds=decimal_odds,
                    synced_at=now,
                )
                self.db.add(odd)
                existing[provider_odd_id] = odd
                created += 1
            else:
                updated += 1

            odd.match_id = match.id
            odd.provider_fixture_id = int(match.sportmonks_id)
            odd.market_id = market_id
            odd.market_name = market.get("name")
            odd.market_developer_name = market.get("developer_name")
            odd.market_description = item.get("market_description")
            odd.bookmaker_id = bookmaker_id
            odd.bookmaker_name = bookmaker.get("name")
            odd.label = item.get("label")
            odd.selection_name = item.get("name")
            odd.original_label = item.get("original_label")
            odd.decimal_odds = decimal_odds
            odd.probability = self._probability(item.get("probability"))
            odd.total = None if item.get("total") is None else str(item.get("total"))
            odd.handicap = None if item.get("handicap") is None else str(item.get("handicap"))
            odd.sort_order = item.get("sort_order")
            odd.winning = bool(item.get("winning", False))
            odd.stopped = bool(item.get("stopped", False))
            odd.provider_created_at = self._parse_datetime(item.get("created_at"))
            odd.latest_bookmaker_update = self._parse_datetime(item.get("latest_bookmaker_update"))
            odd.synced_at = now

        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return {
            "match_id": match.id,
            "fixture_id": int(match.sportmonks_id),
            "received": len(rows),
            "created": created,
            "updated": updated,
            "skipped": skipped,
        }
