import asyncio
from typing import Any

from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import Team
from app.services.sportmonks_service import (
    SportmonksAPIError,
    SportmonksService,
)


def extract_logo_url(
    team_data: dict[str, Any],
) -> str | None:
    """
    استخراج رابط شعار الفريق من
    استجابة Sportmonks.
    """

    possible_keys = (
        "image_path",
        "logo_path",
        "image_url",
        "logo_url",
        "image",
        "logo",
    )

    for key in possible_keys:
        value = team_data.get(key)

        if isinstance(value, str):
            clean_value = value.strip()

            if clean_value:
                return clean_value

        if isinstance(value, dict):
            nested_value = (
                value.get("path")
                or value.get("url")
                or value.get("image_path")
            )

            if isinstance(nested_value, str):
                clean_nested_value = (
                    nested_value.strip()
                )

                if clean_nested_value:
                    return clean_nested_value

    return None


async def backfill_team_logos() -> None:
    """
    جلب شعارات جميع الفرق المرتبطة
    بمعرف Sportmonks وحفظها محليًا.
    """

    db = SessionLocal()

    updated = 0
    skipped = 0
    failed = 0

    try:
        sportmonks = SportmonksService()

        statement = (
            select(Team)
            .where(
                Team.sportmonks_id.is_not(None),
            )
            .order_by(Team.id.asc())
        )

        teams = list(
            db.scalars(statement).all()
        )

        print(
            f"Teams found: {len(teams)}"
        )

        for team in teams:
            try:
                response = (
                    await sportmonks.get_team(
                        sportmonks_team_id=int(
                            team.sportmonks_id
                        ),
                        include_statistics=False,
                    )
                )

                team_data = (
                    sportmonks
                    .extract_single_data(
                        response
                    )
                )

                if team_data is None:
                    skipped += 1

                    print(
                        f"SKIPPED: {team.name} "
                        "- no team data"
                    )

                    continue

                logo_url = extract_logo_url(
                    team_data
                )

                if not logo_url:
                    skipped += 1

                    print(
                        f"SKIPPED: {team.name} "
                        "- no logo returned"
                    )

                    continue

                team.logo_url = logo_url

                db.commit()
                db.refresh(team)

                updated += 1

                print(
                    f"UPDATED: {team.name}"
                )
                print(
                    f"LOGO: {team.logo_url}"
                )

            except SportmonksAPIError as error:
                db.rollback()
                failed += 1

                print(
                    f"FAILED: {team.name} "
                    f"- {error}"
                )

            except Exception as error:
                db.rollback()
                failed += 1

                print(
                    f"FAILED: {team.name} "
                    f"- {error}"
                )

        print("")
        print("Backfill completed.")
        print(f"Updated: {updated}")
        print(f"Skipped: {skipped}")
        print(f"Failed: {failed}")

    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(
        backfill_team_logos()
    )