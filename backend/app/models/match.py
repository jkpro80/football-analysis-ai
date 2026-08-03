from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)

    sportmonks_id: Mapped[int] = mapped_column(
        unique=True,
        nullable=False,
    )

    home_team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id"),
        nullable=False,
    )

    away_team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id"),
        nullable=False,
    )

    date: Mapped[datetime] = mapped_column(
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        nullable=False,
    )

    home_score: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    away_score: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    # ---------- Competition ----------

    league_name: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    league_logo: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    season_name: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    round_name: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    stage_name: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    # ---------- Venue ----------

    venue_name: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    venue_city: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    venue_capacity: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    venue_image: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    # ---------- Referee ----------

    referee_name: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    @property
    def kickoff(self) -> datetime:
        """
        اسم بديل للتوافق مع الخدمات التي تستخدم match.kickoff.
        """
        return self.date

    @kickoff.setter
    def kickoff(self, value: datetime) -> None:
        self.date = value