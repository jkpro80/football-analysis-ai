from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date

from app.data.schemas.football import (
    CompetitionData,
    MatchData,
    StandingRowData,
    TeamData,
)


class FootballDataProvider(ABC):
    """الواجهة الموحدة لجميع مزودي بيانات كرة القدم."""

    @abstractmethod
    async def get_competitions(self) -> list[CompetitionData]:
        raise NotImplementedError

    @abstractmethod
    async def get_matches(
        self,
        date_from: date | None = None,
        date_to: date | None = None,
        competition_code: str | None = None,
        status: str | None = None,
    ) -> list[MatchData]:
        raise NotImplementedError

    @abstractmethod
    async def get_teams(
        self,
        competition_code: str,
        season: int | None = None,
    ) -> list[TeamData]:
        raise NotImplementedError

    @abstractmethod
    async def get_standings(
        self,
        competition_code: str,
        season: int | None = None,
    ) -> list[StandingRowData]:
        raise NotImplementedError

    @abstractmethod
    async def close(self) -> None:
        raise NotImplementedError