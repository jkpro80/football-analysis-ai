from sqlalchemy.orm import Session

from app.database.models import Team
from app.repositories.base_repository import BaseRepository


class TeamRepository(BaseRepository):

    def get(self, team_id: int):
        return (
            self.db.query(Team)
            .filter(Team.id == team_id)
            .first()
        )

    def get_all(self):
        return (
            self.db.query(Team)
            .all()
        )

    def get_by_sportmonks_id(self, sportmonks_id: int):
        return (
            self.db.query(Team)
            .filter(Team.sportmonks_id == sportmonks_id)
            .first()
        )

    def create(self, **kwargs):
        team = Team(**kwargs)

        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        return team

    def update(self, team: Team, **kwargs):

        for key, value in kwargs.items():
            setattr(team, key, value)

        self.db.commit()
        self.db.refresh(team)

        return team