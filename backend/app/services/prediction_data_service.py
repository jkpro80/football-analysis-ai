from app.repositories.team_repository import TeamRepository
from app.repositories.match_repository import MatchRepository
from app.repositories.statistics_repository import StatisticsRepository


class PredictionDataService:

    def __init__(self, db):
        self.team_repository = TeamRepository(db)
        self.match_repository = MatchRepository(db)
        self.statistics_repository = StatisticsRepository(db)

    def get_match_data(self, match_id: int):

        match = self.match_repository.get(match_id)

        if match is None:
            return None

        home_team = self.team_repository.get(match.home_team_id)
        away_team = self.team_repository.get(match.away_team_id)

        statistics = self.statistics_repository.get_fixture_statistics(match.id)

        recent_home = self.match_repository.get_recent_matches(
            match.home_team_id,
            limit=5,
        )

        recent_away = self.match_repository.get_recent_matches(
            match.away_team_id,
            limit=5,
        )

        head_to_head = self.match_repository.get_head_to_head(
            match.home_team_id,
            match.away_team_id,
            limit=10,
        )

        return {
            "match": match,
            "home_team": home_team,
            "away_team": away_team,
            "statistics": statistics,
            "recent_home": recent_home,
            "recent_away": recent_away,
            "head_to_head": head_to_head,
            "home_form": recent_home,
"away_form": recent_away,
        }