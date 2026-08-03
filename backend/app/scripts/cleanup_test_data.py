from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import (
    Match,
    PredictionRecord,
    Team,
)


TEST_TEAM_NAMES = {
    "Real Madrid",
    "Barcelona",
    "Manchester City",
    "Liverpool",
    "Arsenal",
}


def cleanup_test_data(
    dry_run: bool = True,
) -> None:
    """
    معاينة أو حذف البيانات التجريبية.

    dry_run=True:
    يعرض البيانات فقط دون حذف.

    dry_run=False:
    يحذف التوقعات والمباريات والفرق
    التجريبية التي لا تحتوي على Sportmonks ID.
    """

    db = SessionLocal()

    try:
        team_statement = (
            select(Team)
            .where(
                Team.name.in_(TEST_TEAM_NAMES),
                Team.sportmonks_id.is_(None),
            )
            .order_by(Team.id.asc())
        )

        test_teams = list(
            db.scalars(team_statement).all()
        )

        test_team_ids = [
            team.id
            for team in test_teams
        ]

        if not test_team_ids:
            print(
                "No matching test teams were found."
            )
            return

        match_statement = (
            select(Match)
            .where(
                (
                    Match.home_team_id.in_(
                        test_team_ids
                    )
                )
                |
                (
                    Match.away_team_id.in_(
                        test_team_ids
                    )
                )
            )
            .order_by(Match.id.asc())
        )

        test_matches = list(
            db.scalars(match_statement).all()
        )

        test_match_ids = [
            match.id
            for match in test_matches
        ]

        prediction_records: list[
            PredictionRecord
        ] = []

        if test_match_ids:
            prediction_statement = (
                select(PredictionRecord)
                .where(
                    PredictionRecord.match_id.in_(
                        test_match_ids
                    )
                )
                .order_by(
                    PredictionRecord.id.asc()
                )
            )

            prediction_records = list(
                db.scalars(
                    prediction_statement
                ).all()
            )

        print("")
        print("TEST DATA REPORT")
        print("================")
        print(
            f"Teams found: {len(test_teams)}"
        )
        print(
            f"Matches found: {len(test_matches)}"
        )
        print(
            "Prediction records found: "
            f"{len(prediction_records)}"
        )
        print("")

        print("Teams:")
        for team in test_teams:
            print(
                f"- ID {team.id}: "
                f"{team.name}"
            )

        print("")
        print("Matches:")
        for match in test_matches:
            print(
                f"- ID {match.id}: "
                f"home_team_id="
                f"{match.home_team_id}, "
                f"away_team_id="
                f"{match.away_team_id}, "
                f"date={match.date}"
            )

        if dry_run:
            print("")
            print(
                "DRY RUN: No records were deleted."
            )
            return

        for prediction in prediction_records:
            db.delete(prediction)

        db.flush()

        for match in test_matches:
            db.delete(match)

        db.flush()

        for team in test_teams:
            db.delete(team)

        db.commit()

        print("")
        print("Cleanup completed.")
        print(
            "Deleted prediction records: "
            f"{len(prediction_records)}"
        )
        print(
            f"Deleted matches: {len(test_matches)}"
        )
        print(
            f"Deleted teams: {len(test_teams)}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    cleanup_test_data(
        dry_run=True,
    )