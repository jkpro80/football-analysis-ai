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