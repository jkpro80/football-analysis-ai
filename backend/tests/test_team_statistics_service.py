from types import SimpleNamespace

from app.services.team_statistics_service import (
    TeamStatisticsService,
)


def make_match(
    *,
    match_id: int,
    home_team_id: int,
    away_team_id: int,
    home_score: int,
    away_score: int,
    status: str = "finished",
):
    return SimpleNamespace(
        id=match_id,
        home_team_id=home_team_id,
        away_team_id=away_team_id,
        home_score=home_score,
        away_score=away_score,
        status=status,
    )


def test_extract_home_team_score():
    match = make_match(
        match_id=1,
        home_team_id=10,
        away_team_id=20,
        home_score=2,
        away_score=1,
    )

    score = TeamStatisticsService._extract_team_score(
        match=match,
        team_id=10,
    )

    assert score == (2, 1)


def test_extract_away_team_score():
    match = make_match(
        match_id=1,
        home_team_id=10,
        away_team_id=20,
        home_score=2,
        away_score=3,
    )

    score = TeamStatisticsService._extract_team_score(
        match=match,
        team_id=20,
    )

    assert score == (3, 2)


def test_completed_statuses():
    assert TeamStatisticsService._is_completed(
        "finished"
    )
    assert TeamStatisticsService._is_completed(
        "FT"
    )
    assert not TeamStatisticsService._is_completed(
        "scheduled"
    )


def test_percentage():
    assert TeamStatisticsService._percentage(
        3,
        5,
    ) == 60.0

    assert TeamStatisticsService._percentage(
        0,
        0,
    ) == 0.0