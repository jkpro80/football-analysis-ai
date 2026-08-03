from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    sportmonks_id: Mapped[int] = mapped_column(unique=True, index=True)

    name: Mapped[str] = mapped_column(String(200))
    short_name: Mapped[str | None]

    country: Mapped[str | None]

    logo: Mapped[str | None]