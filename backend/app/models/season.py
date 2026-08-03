from datetime import date

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Season(Base):
    __tablename__ = "seasons"

    id: Mapped[int] = mapped_column(primary_key=True)

    sportmonks_id: Mapped[int] = mapped_column(unique=True)

    competition_id: Mapped[int] = mapped_column(
        ForeignKey("competitions.id")
    )

    name: Mapped[str]

    start_date: Mapped[date]
    end_date: Mapped[date]