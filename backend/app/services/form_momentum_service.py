from __future__ import annotations

from typing import Any

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database.models import Match


class FormMomentumService:
    """
    تحليل مستوى الفريق في المباريات السابقة للمباراة المطلوبة.

    الخصائص:
    - يعتمد فقط على المباريات الأقدم من المباراة الحالية.
    - يستبعد المباراة الحالية.
    - يعطي المباريات الأحدث وزنًا أكبر.
    - لا يعدّل قاعدة البيانات.
    - يوفر حماية من Data Leakage.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def calculate(
        self,
        fixture_id: int,
        limit: int = 5,
    ) -> dict[str, Any]:
        """
        حساب Form Momentum للفريقين.
        """

        match = self.db.get(
            Match,
            fixture_id,
        )

        if match is None:
            raise ValueError(
                "Match not found."
            )

        if match.home_team_id is None:
            raise ValueError(
                "Home team ID is missing."
            )

        if match.away_team_id is None:
            raise ValueError(
                "Away team ID is missing."
            )

        safe_limit = max(
            3,
            min(
                int(limit),
                20,
            ),
        )

        home_form = self._calculate_team_form(
            team_id=match.home_team_id,
            before_date=match.date,
            current_fixture_id=fixture_id,
            limit=safe_limit,
        )

        away_form = self._calculate_team_form(
            team_id=match.away_team_id,
            before_date=match.date,
            current_fixture_id=fixture_id,
            limit=safe_limit,
        )

        home_momentum = float(
            home_form["momentum_score"]
        )

        away_momentum = float(
            away_form["momentum_score"]
        )

        momentum_difference = (
            home_momentum - away_momentum
        )

        multipliers = (
            self._calculate_multipliers(
                momentum_difference=(
                    momentum_difference
                ),
                home_sample_size=int(
                    home_form["sample_size"]
                ),
                away_sample_size=int(
                    away_form["sample_size"]
                ),
                requested_limit=safe_limit,
            )
        )

        return {
            "method": (
                "Weighted recent form momentum"
            ),
            "fixture_id": fixture_id,
            "recent_limit": safe_limit,
            "home": home_form,
            "away": away_form,
            "momentum_difference": round(
                momentum_difference,
                3,
            ),
            "home_xg_multiplier": (
                multipliers[
                    "home_xg_multiplier"
                ]
            ),
            "away_xg_multiplier": (
                multipliers[
                    "away_xg_multiplier"
                ]
            ),
            "sample_confidence": (
                multipliers[
                    "sample_confidence"
                ]
            ),
            "data_leakage_protection": True,
        }

    def _calculate_team_form(
        self,
        team_id: int,
        before_date: Any,
        current_fixture_id: int,
        limit: int,
    ) -> dict[str, Any]:
        """
        تحليل المباريات السابقة لفريق واحد.
        """

        matches = (
            self.db.query(Match)
            .filter(
                and_(
                    Match.id != current_fixture_id,
                    Match.date < before_date,
                    Match.home_score.isnot(None),
                    Match.away_score.isnot(None),
                    or_(
                        Match.home_team_id
                        == team_id,
                        Match.away_team_id
                        == team_id,
                    ),
                )
            )
            .order_by(
                Match.date.desc()
            )
            .limit(limit)
            .all()
        )

        if not matches:
            return self._empty_form(
                team_id=team_id,
            )

        points_total = 0.0
        maximum_points = 0.0

        weighted_goals_for = 0.0
        weighted_goals_against = 0.0
        total_weight = 0.0

        wins = 0
        draws = 0
        losses = 0

        clean_sheets = 0
        failed_to_score = 0
        btts_matches = 0
        over_2_5_matches = 0

        results: list[str] = []
        match_details: list[
            dict[str, Any]
        ] = []

        total_matches = len(matches)

        for index, previous_match in enumerate(
            matches
        ):
            # القائمة مرتبة من الأحدث إلى الأقدم.
            # أحدث مباراة تحصل على أعلى وزن.
            weight = float(
                total_matches - index
            )

            is_home = (
                previous_match.home_team_id
                == team_id
            )

            if is_home:
                goals_for = int(
                    previous_match.home_score
                )
                goals_against = int(
                    previous_match.away_score
                )
                opponent_id = (
                    previous_match.away_team_id
                )
                venue = "home"
            else:
                goals_for = int(
                    previous_match.away_score
                )
                goals_against = int(
                    previous_match.home_score
                )
                opponent_id = (
                    previous_match.home_team_id
                )
                venue = "away"

            if goals_for > goals_against:
                result = "W"
                match_points = 3.0
                wins += 1

            elif goals_for == goals_against:
                result = "D"
                match_points = 1.0
                draws += 1

            else:
                result = "L"
                match_points = 0.0
                losses += 1

            if goals_against == 0:
                clean_sheets += 1

            if goals_for == 0:
                failed_to_score += 1

            if (
                goals_for > 0
                and goals_against > 0
            ):
                btts_matches += 1

            if (
                goals_for
                + goals_against
                > 2
            ):
                over_2_5_matches += 1

            points_total += (
                match_points * weight
            )

            maximum_points += (
                3.0 * weight
            )

            weighted_goals_for += (
                goals_for * weight
            )

            weighted_goals_against += (
                goals_against * weight
            )

            total_weight += weight

            results.append(result)

            match_details.append(
                {
                    "fixture_id": (
                        previous_match.id
                    ),
                    "date": str(
                        previous_match.date
                    ),
                    "venue": venue,
                    "opponent_id": (
                        opponent_id
                    ),
                    "score": (
                        f"{goals_for}-"
                        f"{goals_against}"
                    ),
                    "result": result,
                    "weight": round(
                        weight,
                        2,
                    ),
                }
            )

        weighted_points_ratio = (
            points_total / maximum_points
            if maximum_points > 0
            else 0.5
        )

        weighted_goals_for_average = (
            weighted_goals_for
            / total_weight
            if total_weight > 0
            else 1.0
        )

        weighted_goals_against_average = (
            weighted_goals_against
            / total_weight
            if total_weight > 0
            else 1.0
        )

        goal_balance = (
            weighted_goals_for_average
            - weighted_goals_against_average
        )

        # 70% من النقاط الحديثة
        # و30% من توازن التسجيل والاستقبال.
        normalized_goal_balance = (
            self._clamp(
                0.5
                + goal_balance / 6.0,
                0.0,
                1.0,
            )
        )

        momentum_score = (
            weighted_points_ratio * 0.70
            + normalized_goal_balance
            * 0.30
        )

        momentum_score = self._clamp(
            momentum_score,
            0.0,
            1.0,
        )

        streak = self._calculate_streak(
            results
        )

        sample_size = len(matches)

        return {
            "team_id": team_id,
            "sample_size": sample_size,
            "results": results,
            "record": {
                "wins": wins,
                "draws": draws,
                "losses": losses,
            },
            "weighted_points_ratio": round(
                weighted_points_ratio,
                3,
            ),
            "weighted_goals_for": round(
                weighted_goals_for_average,
                3,
            ),
            "weighted_goals_against": round(
                weighted_goals_against_average,
                3,
            ),
            "weighted_goal_balance": round(
                goal_balance,
                3,
            ),
            "momentum_score": round(
                momentum_score,
                3,
            ),
            "momentum_label": (
                self._momentum_label(
                    momentum_score
                )
            ),
            "current_streak": streak,
            "clean_sheet_rate": round(
                clean_sheets
                / sample_size
                * 100.0,
                2,
            ),
            "failed_to_score_rate": round(
                failed_to_score
                / sample_size
                * 100.0,
                2,
            ),
            "btts_rate": round(
                btts_matches
                / sample_size
                * 100.0,
                2,
            ),
            "over_2_5_rate": round(
                over_2_5_matches
                / sample_size
                * 100.0,
                2,
            ),
            "matches": match_details,
        }

    def _calculate_multipliers(
        self,
        momentum_difference: float,
        home_sample_size: int,
        away_sample_size: int,
        requested_limit: int,
    ) -> dict[str, float]:
        """
        تحويل فرق الزخم إلى تعديل محافظ على xG.

        الحد الأقصى:
        ±8% فقط.
        """

        home_sample_ratio = (
            home_sample_size
            / requested_limit
        )

        away_sample_ratio = (
            away_sample_size
            / requested_limit
        )

        sample_confidence = self._clamp(
            min(
                home_sample_ratio,
                away_sample_ratio,
            ),
            0.0,
            1.0,
        )

        raw_adjustment = (
            momentum_difference
            * 0.16
            * sample_confidence
        )

        adjustment = self._clamp(
            raw_adjustment,
            -0.08,
            0.08,
        )

        return {
            "home_xg_multiplier": round(
                1.0 + adjustment,
                4,
            ),
            "away_xg_multiplier": round(
                1.0 - adjustment,
                4,
            ),
            "sample_confidence": round(
                sample_confidence,
                3,
            ),
        }

    @staticmethod
    def _calculate_streak(
        results: list[str],
    ) -> dict[str, Any]:
        """
        حساب السلسلة الحالية.

        النتائج مرتبة من الأحدث إلى الأقدم.
        """

        if not results:
            return {
                "type": "none",
                "length": 0,
            }

        streak_type = results[0]
        streak_length = 0

        for result in results:
            if result != streak_type:
                break

            streak_length += 1

        labels = {
            "W": "win",
            "D": "draw",
            "L": "loss",
        }

        return {
            "type": labels.get(
                streak_type,
                "none",
            ),
            "length": streak_length,
        }

    @staticmethod
    def _momentum_label(
        score: float,
    ) -> str:
        if score >= 0.75:
            return "excellent"

        if score >= 0.60:
            return "strong"

        if score >= 0.45:
            return "balanced"

        if score >= 0.30:
            return "weak"

        return "very_weak"

    @staticmethod
    def _empty_form(
        team_id: int,
    ) -> dict[str, Any]:
        """
        قيمة محايدة عند عدم وجود مباريات سابقة.
        """

        return {
            "team_id": team_id,
            "sample_size": 0,
            "results": [],
            "record": {
                "wins": 0,
                "draws": 0,
                "losses": 0,
            },
            "weighted_points_ratio": 0.5,
            "weighted_goals_for": 1.0,
            "weighted_goals_against": 1.0,
            "weighted_goal_balance": 0.0,
            "momentum_score": 0.5,
            "momentum_label": "balanced",
            "current_streak": {
                "type": "none",
                "length": 0,
            },
            "clean_sheet_rate": 0.0,
            "failed_to_score_rate": 0.0,
            "btts_rate": 0.0,
            "over_2_5_rate": 0.0,
            "matches": [],
        }

    @staticmethod
    def _clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        return max(
            minimum,
            min(
                value,
                maximum,
            ),
        )