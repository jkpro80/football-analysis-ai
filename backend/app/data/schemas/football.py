from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


MatchStatus = Literal[
    "SCHEDULED",
    "TIMED",
    "IN_PLAY",
    "PAUSED",
    "FINISHED",
    "POSTPONED",
    "SUSPENDED",
    "CANCELLED",
    "UNKNOWN",
]


class CompetitionData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    external_id: int
    name: str
    code: str | None = None
    country: str | None = None
    emblem: str | None = None


class TeamData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    external_id: int
    name: str
    short_name: str | None = None
    tla: str | None = None
    country: str | None = None
    crest: str | None = None


class MatchTeamData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    external_id: int | None = None
    name: str
    short_name: str | None = None
    tla: str | None = None
    crest: str | None = None


class MatchScoreData(BaseModel):
    home: int | None = None
    away: int | None = None


class MatchData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    external_id: int
    competition_id: int | None = None
    competition_name: str | None = None
    season_start_year: int | None = None

    utc_date: datetime
    status: MatchStatus = "UNKNOWN"
    matchday: int | None = None
    stage: str | None = None

    home_team: MatchTeamData
    away_team: MatchTeamData

    full_time: MatchScoreData = Field(default_factory=MatchScoreData)
    half_time: MatchScoreData = Field(default_factory=MatchScoreData)


class StandingRowData(BaseModel):
    model_config = ConfigDict(extra="ignore")

    position: int
    team: TeamData
    played_games: int
    won: int
    draw: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int