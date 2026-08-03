from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import Match, Team


def seed_database():
    database = SessionLocal()

    try:
        existing_team = database.scalar(
            select(Team).limit(1)
        )

        if existing_team is not None:
            print(
                "Seed skipped: database already contains teams."
            )
            return

        real_madrid = Team(
            name="Real Madrid",
            country="Spain",
            attack=89,
            defense=86,
            midfield=88,
            elo=1950,
            home_advantage=1.10,
            goals_scored=2.2,
            goals_conceded=0.8,
        )

        barcelona = Team(
            name="Barcelona",
            country="Spain",
            attack=87,
            defense=82,
            midfield=90,
            elo=1910,
            home_advantage=1.08,
            goals_scored=2.0,
            goals_conceded=1.0,
        )

        manchester_city = Team(
            name="Manchester City",
            country="England",
            attack=91,
            defense=88,
            midfield=90,
            elo=1985,
            home_advantage=1.10,
            goals_scored=2.5,
            goals_conceded=0.7,
        )

        liverpool = Team(
            name="Liverpool",
            country="England",
            attack=88,
            defense=84,
            midfield=86,
            elo=1905,
            home_advantage=1.09,
            goals_scored=2.1,
            goals_conceded=1.1,
        )

        database.add_all(
            [
                real_madrid,
                barcelona,
                manchester_city,
                liverpool,
            ]
        )

        database.flush()

        first_match = Match(
            home_team_id=real_madrid.id,
            away_team_id=barcelona.id,
            date="2026-07-20",
            status="scheduled",
        )

        second_match = Match(
            home_team_id=manchester_city.id,
            away_team_id=liverpool.id,
            date="2026-07-21",
            status="scheduled",
        )

        database.add_all(
            [
                first_match,
                second_match,
            ]
        )

        database.commit()

        print("Database seeded successfully.")

    except Exception:
        database.rollback()
        raise

    finally:
        database.close()


if __name__ == "__main__":
    seed_database()