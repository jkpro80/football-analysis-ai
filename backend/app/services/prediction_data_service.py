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

        home_team = self.team_repository.get(
            match.home_team_id
        )
        away_team = self.team_repository.get(
            match.away_team_id
        )

        # Statistics belonging to the target fixture.
        # Kept for existing consumers, but NOT used as
        # historical prediction input.
        statistics = (
            self.statistics_repository.get_fixture_statistics(
                match.id
            )
        )

        # Overall recent form.
        recent_home = (
            self.match_repository.get_recent_matches(
                match.home_team_id,
                limit=5,
                before_date=match.date,
                exclude_match_id=match.id,
            )
        )

        recent_away = (
            self.match_repository.get_recent_matches(
                match.away_team_id,
                limit=5,
                before_date=match.date,
                exclude_match_id=match.id,
            )
        )

        # Venue-specific historical samples.
        recent_home_at_home = (
            self.match_repository.get_recent_matches_by_venue(
                match.home_team_id,
                venue="home",
                limit=5,
                before_date=match.date,
                exclude_match_id=match.id,
            )
        )

        recent_away_at_away = (
            self.match_repository.get_recent_matches_by_venue(
                match.away_team_id,
                venue="away",
                limit=5,
                before_date=match.date,
                exclude_match_id=match.id,
            )
        )

        # Fetch statistics for ALL venue-specific historical
        # fixtures. We intentionally include both teams'
        # rows because DefenseAnalyzer also needs the
        # opponent's statistics from each historical match.
        historical_fixture_ids = list(
            dict.fromkeys(
                [
                    historical_match.id
                    for historical_match in (
                        recent_home_at_home
                        + recent_away_at_away
                    )
                ]
            )
        )

        historical_statistics = (
            self.statistics_repository.get_fixture_statistics_bulk(
                historical_fixture_ids
            )
        )

        head_to_head = (
            self.match_repository.get_head_to_head(
                match.home_team_id,
                match.away_team_id,
                limit=10,
                before_date=match.date,
                exclude_match_id=match.id,
            )
        )

        return {
            "match": match,
            "home_team": home_team,
            "away_team": away_team,

            "statistics": statistics,
            "historical_statistics": historical_statistics,

            "recent_home": recent_home,
            "recent_away": recent_away,

            "recent_home_at_home": recent_home_at_home,
            "recent_away_at_away": recent_away_at_away,

            "head_to_head": head_to_head,

            "home_form": recent_home,
            "away_form": recent_away,
        }
