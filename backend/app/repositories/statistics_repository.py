from app.database.models import MatchStatistic
from app.repositories.base_repository import BaseRepository


class StatisticsRepository(BaseRepository):

    def get_fixture_statistics(self, fixture_id: int):
        return (
            self.db.query(MatchStatistic)
            .filter(
                MatchStatistic.fixture_id == fixture_id
            )
            .all()
        )

    def get_fixture_statistics_bulk(
        self,
        fixture_ids: list[int],
    ):
        normalized_ids = [
            int(fixture_id)
            for fixture_id in fixture_ids
            if fixture_id is not None
        ]

        if not normalized_ids:
            return []

        return (
            self.db.query(MatchStatistic)
            .filter(
                MatchStatistic.fixture_id.in_(
                    normalized_ids
                )
            )
            .order_by(
                MatchStatistic.fixture_id.asc(),
                MatchStatistic.team_id.asc(),
            )
            .all()
        )

    def get_team_statistics(
        self,
        team_id: int,
        limit: int = 10,
    ):
        return (
            self.db.query(MatchStatistic)
            .filter(
                MatchStatistic.team_id == team_id
            )
            .order_by(
                MatchStatistic.id.desc()
            )
            .limit(limit)
            .all()
        )
