from typing import Any

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.database.models import (
    EloHistory,
    Match,
    MatchStatistic,
    Team,
)


class FeatureEngine:
    """
    تجميع خصائص الفريقين اللازمة
    لبناء توقع مباراة واحدة.

    يعتمد على:
    - ELO التاريخي
    - تقييم الهجوم والدفاع والوسط
    - آخر النتائج السابقة للمباراة
    - الأهداف المسجلة والمستقبلة
    - الاستحواذ
    - الركنيات
    - البطاقات
    - أفضلية الأرض

    يمنع استخدام معلومات حدثت
    بعد تاريخ المباراة الجاري تحليلها.
    """

    def __init__(
        self,
        db: Session,
    ) -> None:
        self.db = db

    def build_match_features(
        self,
        fixture_id: int,
        recent_limit: int = 5,
    ) -> dict[str, Any]:
        """
        بناء الخصائص المطلوبة لمباراة واحدة.

        يتم استخدام المباريات والإحصاءات
        وقيم ELO التي سبقت المباراة فقط.
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

        safe_limit = max(
            1,
            min(recent_limit, 20),
        )

        home_features = (
            self.build_team_features(
                team=home_team,
                recent_limit=safe_limit,
                venue="home",
                before_date=match.date,
                exclude_fixture_id=match.id,
            )
        )

        away_features = (
            self.build_team_features(
                team=away_team,
                recent_limit=safe_limit,
                venue="away",
                before_date=match.date,
                exclude_fixture_id=match.id,
            )
        )

        elo_difference = (
            int(home_features["elo"])
            - int(away_features["elo"])
        )

        attack_difference = (
            float(home_features["attack"])
            - float(away_features["attack"])
        )

        defense_difference = (
            float(home_features["defense"])
            - float(away_features["defense"])
        )

        midfield_difference = (
            float(home_features["midfield"])
            - float(away_features["midfield"])
        )

        form_difference = (
            float(home_features["form_rating"])
            - float(away_features["form_rating"])
        )

        goals_scored_difference = (
            float(home_features["goals_scored"])
            - float(away_features["goals_scored"])
        )

        goals_conceded_difference = (
            float(
                home_features[
                    "goals_conceded"
                ]
            )
            - float(
                away_features[
                    "goals_conceded"
                ]
            )
        )

        return {
            "fixture": {
                "id": match.id,
                "sportmonks_id": (
                    match.sportmonks_id
                ),
                "date": match.date,
                "status": match.status,
                "home_team_id": (
                    match.home_team_id
                ),
                "away_team_id": (
                    match.away_team_id
                ),
                "home_score": (
                    match.home_score
                ),
                "away_score": (
                    match.away_score
                ),
            },
            "home_team": home_features,
            "away_team": away_features,
            "differences": {
                "elo": elo_difference,
                "attack": round(
                    attack_difference,
                    2,
                ),
                "defense": round(
                    defense_difference,
                    2,
                ),
                "midfield": round(
                    midfield_difference,
                    2,
                ),
                "form": round(
                    form_difference,
                    2,
                ),
                "goals_scored": round(
                    goals_scored_difference,
                    2,
                ),
                "goals_conceded": round(
                    goals_conceded_difference,
                    2,
                ),
            },
            "recent_limit": safe_limit,
            "historical_cutoff": (
                match.date
            ),
            "data_leakage_protection": True,
            "historical_elo_protection": True,
            "elo_sources": {
                "home": home_features[
                    "elo_source"
                ],
                "away": away_features[
                    "elo_source"
                ],
            },
        }

    def build_team_features(
        self,
        team: Team,
        recent_limit: int,
        venue: str,
        before_date: str | None = None,
        exclude_fixture_id: int | None = None,
    ) -> dict[str, Any]:
        """
        بناء خصائص فريق واحد من المباريات
        السابقة للمباراة الجاري تحليلها.
        """

        recent_matches = (
            self.get_recent_finished_matches(
                team_id=int(team.id),
                limit=recent_limit,
                before_date=before_date,
                exclude_fixture_id=(
                    exclude_fixture_id
                ),
            )
        )

        (
            historical_elo,
            elo_source,
        ) = self.get_historical_elo(
            team_id=int(team.id),
            before_date=before_date,
            exclude_fixture_id=(
                exclude_fixture_id
            ),
            default_elo=1800,
        )

        form_data = (
            self.calculate_form_features(
                team_id=int(team.id),
                matches=recent_matches,
            )
        )

        statistic_data = (
            self.calculate_statistic_features(
                team_id=int(team.id),
                matches=recent_matches,
            )
        )

        stored_goals_scored = float(
            team.goals_scored or 0
        )

        stored_goals_conceded = float(
            team.goals_conceded or 0
        )

        calculated_goals_scored = float(
            form_data[
                "average_goals_scored"
            ]
        )

        calculated_goals_conceded = float(
            form_data[
                "average_goals_conceded"
            ]
        )

        matches_used = int(
            form_data["matches_used"]
        )

        goals_scored = (
            calculated_goals_scored
            if matches_used > 0
            else stored_goals_scored
        )

        goals_conceded = (
            calculated_goals_conceded
            if matches_used > 0
            else stored_goals_conceded
        )

        possession = self.prefer_value(
            calculated_value=(
                statistic_data["possession"]
            ),
            stored_value=team.possession,
            default_value=50.0,
        )

        corners = self.prefer_value(
            calculated_value=(
                statistic_data["corners"]
            ),
            stored_value=team.corners,
            default_value=5.0,
        )

        yellow_cards = self.prefer_value(
            calculated_value=(
                statistic_data[
                    "yellow_cards"
                ]
            ),
            stored_value=team.yellow_cards,
            default_value=2.0,
        )

        red_cards = self.prefer_value(
            calculated_value=(
                statistic_data["red_cards"]
            ),
            stored_value=team.red_cards,
            default_value=0.0,
        )

        home_advantage = float(
            team.home_advantage or 1.0
        )

        venue_multiplier = (
            home_advantage
            if venue == "home"
            else 1.0
        )

        stored_xg = float(
            team.xg or 0
        )

        stored_xga = float(
            team.xga or 0
        )

        effective_xg = (
            stored_xg
            if stored_xg > 0
            else goals_scored
        )

        effective_xga = (
            stored_xga
            if stored_xga > 0
            else goals_conceded
        )

        return {
            "id": team.id,
            "sportmonks_id": (
                team.sportmonks_id
            ),
            "name": team.name,
            "country": team.country,

            "logo_url": getattr(
                team,
                "logo_url",
                None,
            ),
            "venue": venue,
            "elo": historical_elo,
            "elo_source": elo_source,
            "attack": int(
                team.attack or 80
            ),
            "defense": int(
                team.defense or 80
            ),
            "midfield": int(
                team.midfield or 80
            ),
            "home_advantage": (
                home_advantage
            ),
            "venue_multiplier": (
                venue_multiplier
            ),
            "matches_used": matches_used,
            "wins": form_data["wins"],
            "draws": form_data["draws"],
            "losses": form_data["losses"],
            "points": form_data["points"],
            "maximum_points": (
                form_data["maximum_points"]
            ),
            "form": form_data["form"],
            "form_rating": (
                form_data["form_rating"]
            ),
            "goals_scored": round(
                goals_scored,
                2,
            ),
            "goals_conceded": round(
                goals_conceded,
                2,
            ),
            "goals_scored_total": (
                form_data[
                    "goals_scored_total"
                ]
            ),
            "goals_conceded_total": (
                form_data[
                    "goals_conceded_total"
                ]
            ),
            "goal_difference": (
                form_data["goal_difference"]
            ),
            "possession": round(
                possession,
                2,
            ),
            "shots": float(
                team.shots or 0
            ),
            "shots_on_target": float(
                team.shots_on_target or 0
            ),
            "corners": round(
                corners,
                2,
            ),
            "yellow_cards": round(
                yellow_cards,
                2,
            ),
            "red_cards": round(
                red_cards,
                2,
            ),
            "clean_sheets": float(
                team.clean_sheets or 0
            ),
            "failed_to_score": float(
                team.failed_to_score or 0
            ),
            "xg": round(
                effective_xg,
                2,
            ),
            "xga": round(
                effective_xga,
                2,
            ),
            "statistics_rows_used": int(
                statistic_data[
                    "statistics_rows_used"
                ]
            ),
        }

    def get_historical_elo(
        self,
        team_id: int,
        before_date: str | None,
        exclude_fixture_id: int | None = None,
        default_elo: int = 1800,
    ) -> tuple[int, str]:
        """
        جلب آخر قيمة ELO مسجلة للفريق
        قبل المباراة الجاري تحليلها.

        إذا لم يوجد سجل تاريخي سابق،
        تُستخدم القيمة الافتراضية 1800.

        عند تحليل مباراة مستقبلية دون تاريخ
        مرجعي، يمكن استخدام قيمة الفريق الحالية.
        """

        if before_date is None:
            team = self.db.get(
                Team,
                team_id,
            )

            if team is None:
                return (
                    default_elo,
                    "default",
                )

            return (
                int(
                    team.elo
                    or default_elo
                ),
                "current_team_value",
            )

        if exclude_fixture_id is not None:
            cutoff_condition = or_(
                Match.date < before_date,
                and_(
                    Match.date == before_date,
                    Match.id
                    < exclude_fixture_id,
                ),
            )

        else:
            cutoff_condition = (
                Match.date < before_date
            )

        statement = (
            select(EloHistory)
            .join(
                Match,
                EloHistory.match_id
                == Match.id,
            )
            .where(
                or_(
                    EloHistory.home_team_id
                    == team_id,
                    EloHistory.away_team_id
                    == team_id,
                ),
                cutoff_condition,
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
                EloHistory.id.desc(),
            )
            .limit(1)
        )

        history = self.db.scalar(
            statement
        )

        if history is None:
            return (
                default_elo,
                "historical_default",
            )

        if (
            int(history.home_team_id)
            == team_id
        ):
            return (
                int(
                    history.home_elo_after
                ),
                "elo_history",
            )

        if (
            int(history.away_team_id)
            == team_id
        ):
            return (
                int(
                    history.away_elo_after
                ),
                "elo_history",
            )

        return (
            default_elo,
            "historical_default",
        )

    def get_recent_finished_matches(
        self,
        team_id: int,
        limit: int,
        before_date: str | None = None,
        exclude_fixture_id: int | None = None,
    ) -> list[Match]:
        """
        جلب آخر المباريات المنتهية للفريق.

        عند تحليل مباراة تاريخية، لا يتم
        استخدام أي مباراة وقعت بعدها.

        إذا كانت مباراتان في التاريخ نفسه،
        يستخدم المعرف المحلي لمنع إدخال
        المباراة الجاري تحليلها.
        """

        conditions = [
            or_(
                Match.home_team_id
                == team_id,
                Match.away_team_id
                == team_id,
            ),
            Match.home_score.is_not(
                None
            ),
            Match.away_score.is_not(
                None
            ),
        ]

        if before_date is not None:
            if exclude_fixture_id is not None:
                conditions.append(
                    or_(
                        Match.date
                        < before_date,
                        and_(
                            Match.date
                            == before_date,
                            Match.id
                            < exclude_fixture_id,
                        ),
                    )
                )

            else:
                conditions.append(
                    Match.date
                    < before_date
                )

        elif exclude_fixture_id is not None:
            conditions.append(
                Match.id
                != exclude_fixture_id
            )

        statement = (
            select(Match)
            .where(*conditions)
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(limit)
        )

        return list(
            self.db.scalars(
                statement
            ).all()
        )

    def calculate_form_features(
        self,
        team_id: int,
        matches: list[Match],
    ) -> dict[str, Any]:
        """
        حساب الفورمة والأهداف من المباريات.
        """

        wins = 0
        draws = 0
        losses = 0

        goals_scored = 0
        goals_conceded = 0

        form: list[str] = []

        for match in matches:
            is_home = (
                match.home_team_id
                == team_id
            )

            team_score = (
                match.home_score
                if is_home
                else match.away_score
            )

            opponent_score = (
                match.away_score
                if is_home
                else match.home_score
            )

            team_score = int(
                team_score or 0
            )

            opponent_score = int(
                opponent_score or 0
            )

            goals_scored += team_score

            goals_conceded += (
                opponent_score
            )

            if team_score > opponent_score:
                wins += 1
                form.append("W")

            elif team_score == opponent_score:
                draws += 1
                form.append("D")

            else:
                losses += 1
                form.append("L")

        matches_used = len(
            matches
        )

        points = (
            wins * 3
            + draws
        )

        maximum_points = (
            matches_used * 3
        )

        form_rating = (
            round(
                points
                / maximum_points
                * 100,
                2,
            )
            if maximum_points > 0
            else 0.0
        )

        average_goals_scored = (
            round(
                goals_scored
                / matches_used,
                2,
            )
            if matches_used > 0
            else 0.0
        )

        average_goals_conceded = (
            round(
                goals_conceded
                / matches_used,
                2,
            )
            if matches_used > 0
            else 0.0
        )

        return {
            "matches_used": matches_used,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "points": points,
            "maximum_points": (
                maximum_points
            ),
            "form": "".join(
                form
            ),
            "form_rating": (
                form_rating
            ),
            "goals_scored_total": (
                goals_scored
            ),
            "goals_conceded_total": (
                goals_conceded
            ),
            "goal_difference": (
                goals_scored
                - goals_conceded
            ),
            "average_goals_scored": (
                average_goals_scored
            ),
            "average_goals_conceded": (
                average_goals_conceded
            ),
        }

    def calculate_statistic_features(
        self,
        team_id: int,
        matches: list[Match],
    ) -> dict[str, float | int | None]:
        """
        حساب متوسط إحصاءات الفريق
        للمباريات التاريخية المحددة.
        """

        match_ids = [
            int(match.id)
            for match in matches
        ]

        if not match_ids:
            return {
                "possession": None,
                "corners": None,
                "yellow_cards": None,
                "red_cards": None,
                "statistics_rows_used": 0,
            }

        statement = (
            select(MatchStatistic)
            .where(
                MatchStatistic.team_id
                == team_id,
                MatchStatistic.fixture_id.in_(
                    match_ids
                ),
            )
        )

        statistics = list(
            self.db.scalars(
                statement
            ).all()
        )

        return {
            "possession": self.average(
                [
                    item.possession
                    for item in statistics
                ]
            ),
            "corners": self.average(
                [
                    item.corners
                    for item in statistics
                ]
            ),
            "yellow_cards": self.average(
                [
                    item.yellow_cards
                    for item in statistics
                ]
            ),
            "red_cards": self.average(
                [
                    item.red_cards
                    for item in statistics
                ]
            ),
            "statistics_rows_used": len(
                statistics
            ),
        }

    @staticmethod
    def average(
        values: list[float | None],
    ) -> float | None:
        """
        حساب المتوسط مع تجاهل القيم الفارغة.
        """

        valid_values = [
            float(value)
            for value in values
            if value is not None
        ]

        if not valid_values:
            return None

        return round(
            sum(valid_values)
            / len(valid_values),
            2,
        )

    @staticmethod
    def prefer_value(
        calculated_value: float | None,
        stored_value: Any,
        default_value: float,
    ) -> float:
        """
        استخدام القيمة المحسوبة أولًا،
        ثم المخزنة، ثم القيمة الافتراضية.
        """

        if calculated_value is not None:
            return float(
                calculated_value
            )

        if stored_value is not None:
            return float(
                stored_value
            )

        return float(
            default_value
        )
