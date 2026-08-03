from pydantic import BaseModel
from typing import Any


class MatchInfo(BaseModel):
    id: int
    home_team: str
    away_team: str
    date: str
    status: str


class LeagueInfo(BaseModel):
    name: str | None = None
    logo: str | None = None


class SeasonInfo(BaseModel):
    name: str | None = None


class VenueInfo(BaseModel):
    name: str | None = None
    city: str | None = None
    capacity: int | None = None
    image: str | None = None


class RefereeInfo(BaseModel):
    name: str | None = None


class LatestPredictionResponse(BaseModel):
    api_version: str
    engine_version: str

    match: MatchInfo

    league: LeagueInfo | None = None
    season: SeasonInfo | None = None
    round: str | None = None
    stage: str | None = None
    venue: VenueInfo | None = None
    referee: RefereeInfo | None = None

    prediction: dict[str, Any]

    markets: dict[str, Any]

    analysis: dict[str, Any]

    features: dict[str, Any]

    meta: dict[str, Any]