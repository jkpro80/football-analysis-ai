from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    EloHistory,
    Match,
    Team,
)
from app.engine.elo_engine import EloEngine


def calculate_elo_expected(
    rating: int,
    opponent_rating: int,
) -> float:
    """
    حساب النتيجة المتوقعة وفق معادلة ELO التقليدية.

    هذه الدالة موجودة للحفاظ على توافق
    الأجزاء القديمة من المشروع.
    """

    return 1.0 / (
        1.0
        + 10
        ** (
            (
                opponent_rating
                - rating
            )
            / 400.0
        )
    )


def update_elo_ratings(
    home_team: Team,
    away_team: Team,
    home_result: float,
    away_result: float,
    k_factor: int = 24,
) -> None:
    """
    تحديث ELO بالطريقة القديمة.

    هذه الدالة باقية حتى لا تتعطل
    الخدمات القديمة التي تستخدمها.
    """

    home_elo = int(
        home_team.elo or 1800
    )

    away_elo = int(
        away_team.elo or 1800
    )

    home_expected = (
        calculate_elo_expected(
            home_elo,
            away_elo,
        )
    )

    away_expected = (
        calculate_elo_expected(
            away_elo,
            home_elo,
        )
    )

    home_team.elo = round(
        home_elo
        + k_factor
        * (
            home_result
            - home_expected
        )
    )

    away_team.elo = round(
        away_elo
        + k_factor
        * (
            away_result
            - away_expected
        )
    )


class EloService:
    """
    خدمة ربط EloEngine بالمباريات
    والفرق الموجودة في قاعدة البيانات.
    """

    def __init__(
        self,
        db: Session,
        engine: EloEngine | None = None,
    ) -> None:
        self.db = db

        self.engine = (
            engine
            if engine is not None
            else EloEngine()
        )

    def preview_fixture_update(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        """
        معاينة تحديث ELO لمباراة منتهية
        دون تعديل قاعدة البيانات.

        fixture_id هو المعرف المحلي.
        """

        match = self.db.get(
            Match,
            fixture_id,
        )

        if match is None:
            raise ValueError(
                "Fixture was not found "
                "in the local database."
            )

        if (
            match.home_score is None
            or match.away_score is None
        ):
            raise ValueError(
                "Fixture does not have "
                "a completed score."
            )

        home_team = self.db.get(
            Team,
            match.home_team_id,
        )

        away_team = self.db.get(
            Team,
            match.away_team_id,
        )

        if (
            home_team is None
            or away_team is None
        ):
            raise ValueError(
                "One or both fixture teams "
                "were not found."
            )

        home_elo = int(
            home_team.elo or 1800
        )

        away_elo = int(
            away_team.elo or 1800
        )

        calculation = (
            self.engine
            .calculate_match_ratings(
                home_rating=home_elo,
                away_rating=away_elo,
                home_score=int(
                    match.home_score
                ),
                away_score=int(
                    match.away_score
                ),
                apply_home_advantage=True,
            )
        )

        return {
            "fixture": {
                "local_id": match.id,
                "sportmonks_id": (
                    match.sportmonks_id
                ),
                "date": match.date,
                "status": match.status,
                "home_score": (
                    match.home_score
                ),
                "away_score": (
                    match.away_score
                ),
            },
            "home_team": {
                "id": home_team.id,
                "name": home_team.name,
                "elo_before": (
                    calculation
                    .home_rating_before
                ),
                "elo_change": (
                    calculation
                    .home_rating_change
                ),
                "elo_after": (
                    calculation
                    .home_rating_after
                ),
                "expected_score": (
                    calculation
                    .expected_home
                ),
                "actual_score": (
                    calculation
                    .actual_home
                ),
            },
            "away_team": {
                "id": away_team.id,
                "name": away_team.name,
                "elo_before": (
                    calculation
                    .away_rating_before
                ),
                "elo_change": (
                    calculation
                    .away_rating_change
                ),
                "elo_after": (
                    calculation
                    .away_rating_after
                ),
                "expected_score": (
                    calculation
                    .expected_away
                ),
                "actual_score": (
                    calculation
                    .actual_away
                ),
            },
            "result": (
                calculation.result
            ),
            "goal_difference": (
                calculation
                .goal_difference
            ),
            "database_updated": False,
        }

    def apply_fixture_update(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        """
        تطبيق تحديث ELO مرة واحدة فقط،
        وتسجيل العملية داخل elo_history.
        """

        existing_history = (
            self.db.query(EloHistory)
            .filter(
                EloHistory.match_id
                == fixture_id
            )
            .first()
        )

        if existing_history is not None:
            raise ValueError(
                "ELO was already applied "
                "for this fixture."
            )

        preview = (
            self.preview_fixture_update(
                fixture_id=fixture_id
            )
        )

        fixture_data = preview[
            "fixture"
        ]

        home_data = preview[
            "home_team"
        ]

        away_data = preview[
            "away_team"
        ]

        match = self.db.get(
            Match,
            fixture_data["local_id"],
        )

        home_team = self.db.get(
            Team,
            home_data["id"],
        )

        away_team = self.db.get(
            Team,
            away_data["id"],
        )

        if match is None:
            raise ValueError(
                "Fixture was not found."
            )

        if (
            home_team is None
            or away_team is None
        ):
            raise ValueError(
                "Fixture teams were not found."
            )

        history = EloHistory(
            match_id=match.id,
            home_team_id=home_team.id,
            away_team_id=away_team.id,
            home_elo_before=int(
                home_data["elo_before"]
            ),
            away_elo_before=int(
                away_data["elo_before"]
            ),
            home_elo_change=int(
                home_data["elo_change"]
            ),
            away_elo_change=int(
                away_data["elo_change"]
            ),
            home_elo_after=int(
                home_data["elo_after"]
            ),
            away_elo_after=int(
                away_data["elo_after"]
            ),
            result=str(
                preview["result"]
            ),
            goal_difference=int(
                preview["goal_difference"]
            ),
        )

        try:
            home_team.elo = int(
                home_data["elo_after"]
            )

            away_team.elo = int(
                away_data["elo_after"]
            )

            self.db.add(
                history
            )

            self.db.commit()

            self.db.refresh(
                home_team
            )

            self.db.refresh(
                away_team
            )

            self.db.refresh(
                history
            )

        except Exception:
            self.db.rollback()
            raise

        preview["home_team"][
            "saved_elo"
        ] = int(
            home_team.elo
        )

        preview["away_team"][
            "saved_elo"
        ] = int(
            away_team.elo
        )

        preview[
            "elo_history_id"
        ] = int(
            history.id
        )

        preview[
            "database_updated"
        ] = True

        return preview

    def apply_pending_fixtures(
        self,
        limit: int = 50,
    ) -> dict[str, Any]:
        """
        تطبيق ELO على المباريات المنتهية
        التي لم يتم تطبيق ELO عليها سابقًا.

        تتم معالجة المباريات من الأقدم
        إلى الأحدث للحفاظ على التسلسل الزمني.
        """

        safe_limit = max(
            1,
            min(limit, 500),
        )

        processed_match_ids = (
            select(
                EloHistory.match_id
            )
        )

        statement = (
            select(Match)
            .where(
                Match.home_score.is_not(
                    None
                ),
                Match.away_score.is_not(
                    None
                ),
                Match.id.not_in(
                    processed_match_ids
                ),
            )
            .order_by(
                Match.date.asc(),
                Match.id.asc(),
            )
            .limit(safe_limit)
        )

        matches = list(
            self.db.scalars(
                statement
            ).all()
        )

        applied = 0
        skipped = 0
        failed = 0

        results: list[
            dict[str, Any]
        ] = []

        for match in matches:
            try:
                result = (
                    self.apply_fixture_update(
                        fixture_id=match.id
                    )
                )

                applied += 1

                results.append(
                    {
                        "fixture_id": (
                            match.id
                        ),
                        "sportmonks_id": (
                            match.sportmonks_id
                        ),
                        "status": "applied",
                        "elo_history_id": (
                            result.get(
                                "elo_history_id"
                            )
                        ),
                        "home_team": (
                            result[
                                "home_team"
                            ]["name"]
                        ),
                        "away_team": (
                            result[
                                "away_team"
                            ]["name"]
                        ),
                        "home_elo_after": (
                            result[
                                "home_team"
                            ]["elo_after"]
                        ),
                        "away_elo_after": (
                            result[
                                "away_team"
                            ]["elo_after"]
                        ),
                    }
                )

            except ValueError as error:
                self.db.rollback()

                skipped += 1

                results.append(
                    {
                        "fixture_id": (
                            match.id
                        ),
                        "sportmonks_id": (
                            match.sportmonks_id
                        ),
                        "status": "skipped",
                        "reason": str(
                            error
                        ),
                    }
                )

            except Exception as error:
                self.db.rollback()

                failed += 1

                results.append(
                    {
                        "fixture_id": (
                            match.id
                        ),
                        "sportmonks_id": (
                            match.sportmonks_id
                        ),
                        "status": "failed",
                        "error": str(
                            error
                        ),
                    }
                )

        return {
            "status": "success",
            "requested_limit": (
                safe_limit
            ),
            "matches_found": len(
                matches
            ),
            "applied": applied,
            "skipped": skipped,
            "failed": failed,
            "results": results,
        }