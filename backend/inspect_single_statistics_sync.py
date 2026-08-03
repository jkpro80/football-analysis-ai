from __future__ import annotations

from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import Match, MatchStatistic
from app.services.statistics_sync_service import StatisticsSyncService


def main() -> None:
    db = SessionLocal()

    try:
        match = db.scalar(
            select(Match)
            .where(Match.sportmonks_id.is_not(None))
            .order_by(Match.date.desc(), Match.id.desc())
        )

        if match is None:
            raise RuntimeError(
                "No match with a SportMonks fixture ID was found."
            )

        print("=== SELECTED MATCH ===")
        print(
            {
                "local_match_id": match.id,
                "sportmonks_id": match.sportmonks_id,
                "date": str(match.date),
                "home_team_id": match.home_team_id,
                "away_team_id": match.away_team_id,
            }
        )

        service = StatisticsSyncService(db)

        print()
        print("=== STARTING SYNC ===")

        result = service.sync_fixture_statistics(
            fixture_sportmonks_id=int(match.sportmonks_id)
        )

        print()
        print("=== SYNC RESULT ===")
        print(result)

        rows = list(
            db.scalars(
                select(MatchStatistic)
                .where(MatchStatistic.fixture_id == match.id)
                .order_by(MatchStatistic.team_id)
            ).all()
        )

        print()
        print("=== SAVED ROWS ===")

        if not rows:
            print("No MatchStatistic rows were saved.")

        for row in rows:
            print(
                {
                    "id": row.id,
                    "fixture_id": row.fixture_id,
                    "team_id": row.team_id,
                    "possession": row.possession,
                    "corners": row.corners,
                    "goals": row.goals,
                    "yellow_cards": row.yellow_cards,
                    "red_cards": row.red_cards,
                    "assists": row.assists,
                    "successful_dribbles_percentage":
                        row.successful_dribbles_percentage,
                    "raw_statistics_is_null":
                        row.raw_statistics is None,
                    "raw_statistics":
                        row.raw_statistics,
                }
            )

    except Exception as exc:
        db.rollback()
        print()
        print("=== ERROR ===")
        print(type(exc).__name__)
        print(str(exc))
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
