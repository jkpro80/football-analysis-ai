from app.database.models import Match
from app.repositories.base_repository import BaseRepository


class MatchRepository(BaseRepository):

    def get(self, match_id: int):
        return (
            self.db.query(Match)
            .filter(Match.id == match_id)
            .first()
        )

    def get_all(self):
        return self.db.query(Match).all()

    def get_by_sportmonks_id(self, sportmonks_id: int):
        return (
            self.db.query(Match)
            .filter(Match.sportmonks_id == sportmonks_id)
            .first()
        )

    def get_recent_matches(self, team_id: int, limit: int = 5):
        return (
            self.db.query(Match)
            .filter(
                (
                    (Match.home_team_id == team_id)
                    | (Match.away_team_id == team_id)
                ),
                Match.home_score.isnot(None),
                Match.away_score.isnot(None),
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(limit)
            .all()
        )
    def get_head_to_head(
        self,
        home_team_id: int,
        away_team_id: int,
        limit: int = 10,
    ):
        return (
            self.db.query(Match)
            .filter(
                (
                    (
                        (Match.home_team_id == home_team_id)
                        & (Match.away_team_id == away_team_id)
                    )
                    |
                    (
                        (Match.home_team_id == away_team_id)
                        & (Match.away_team_id == home_team_id)
                    )
                ),
                Match.home_score.isnot(None),
                Match.away_score.isnot(None),
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(limit)
            .all()
        )

