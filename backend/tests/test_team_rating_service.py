from datetime import datetime

import pytest

from app.services.team_rating_service import (
    TeamRatingService,
)


class FakeMatch:
    def __init__(
        self,
        match_id: int,
        home_team_id: int,
        away_team_id: int,
        home_score: int | None,
        away_score: int | None,
        status: str,
        kickoff: datetime,
    ) -> None:
        self.id = match_id
        self.home_team_id = home_team_id
        self.away_team_id = away_team_id
        self.home_score = home_score
        self.away_score = away_score
        self.status = status
        self.kickoff = kickoff


class FakeScalarResult:
    def __init__(
        self,
        matches: list[FakeMatch],
    ) -> None:
        self.matches = matches

    def all(self) -> list[FakeMatch]:
        return self.matches


class FakeSession:
    def __init__(
        self,
        matches: list[FakeMatch],
    ) -> None:
        self.matches = matches

    def scalars(
        self,
        statement,
    ) -> FakeScalarResult:
        return FakeScalarResult(
            self.matches
        )


def build_matches() -> list[FakeMatch]:
    return [
        FakeMatch(
            match_id=1,
            home_team_id=1,
            away_team_id=2,
            home_score=2,
            away_score=0,
            status="finished",
            kickoff=datetime(
                2026,
                1,
                1,
                18,
                0,
            ),
        ),
        FakeMatch(
            match_id=2,
            home_team_id=2,
            away_team_id=3,
            home_score=1,
            away_score=1,
            status="completed",
            kickoff=datetime(
                2026,
                1,
                2,
                18,
                0,
            ),
        ),
        FakeMatch(
            match_id=3,
            home_team_id=3,
            away_team_id=1,
            home_score=0,
            away_score=1,
            status="finished",
            kickoff=datetime(
                2026,
                1,
                3,
                18,
                0,
            ),
        ),
    ]


def test_completed_match_detection():
    match = build_matches()[0]

    assert TeamRatingService.is_completed_match(
        match
    ) is True


def test_scheduled_match_is_ignored():
    match = FakeMatch(
        match_id=10,
        home_team_id=1,
        away_team_id=2,
        home_score=None,
        away_score=None,
        status="scheduled",
        kickoff=datetime(
            2026,
            2,
            1,
            18,
            0,
        ),
    )

    assert TeamRatingService.is_completed_match(
        match
    ) is False


def test_calculate_ratings_from_matches():
    service = TeamRatingService(
        db=FakeSession([]),
    )

    ratings = (
        service.calculate_ratings_from_matches(
            build_matches()
        )
    )

    assert set(ratings.keys()) == {
        1,
        2,
        3,
    }

    assert ratings[1] > 1500
    assert ratings[3] < 1500


def test_get_unknown_team_default_rating():
    service = TeamRatingService(
        db=FakeSession([]),
    )

    rating = service.get_team_rating(
        team_id=99,
        ratings={},
    )

    assert rating == 1500.0


def test_compare_teams():
    service = TeamRatingService(
        db=FakeSession([]),
    )

    result = service.compare_teams(
        home_team_id=1,
        away_team_id=2,
        ratings={
            1: 1650,
            2: 1450,
        },
    )

    assert result["home_team_id"] == 1
    assert result["away_team_id"] == 2
    assert result["home_rating"] == 1650
    assert result["away_rating"] == 1450
    assert result["stronger_team"] == "home"
    assert result["source"] == (
        "database_match_history"
    )


def test_build_rating_table():
    service = TeamRatingService(
        db=FakeSession(
            build_matches()
        ),
    )

    table = service.build_rating_table()

    assert len(table) == 3
    assert table[0]["rank"] == 1

    assert (
        table[0]["rating"]
        >= table[1]["rating"]
        >= table[2]["rating"]
    )


def test_service_requires_database():
    with pytest.raises(
        ValueError,
        match="db is required",
    ):
        TeamRatingService(
            db=None,
        )


def test_same_team_comparison_fails():
    service = TeamRatingService(
        db=FakeSession([]),
    )

    with pytest.raises(
        ValueError,
        match="must be different",
    ):
        service.compare_teams(
            home_team_id=1,
            away_team_id=1,
            ratings={},
        )