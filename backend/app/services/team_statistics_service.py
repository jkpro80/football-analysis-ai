from dataclasses import dataclass
from typing import Any, Iterable

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.models import Match, MatchStatistic, Team


@dataclass
class TeamStatistics:
    team_id: int
    matches_played: int

    wins: int
    draws: int
    losses: int

    goals_scored: int
    goals_conceded: int

    goals_per_match: float
    goals_conceded_per_match: float

    points_per_match: float
    clean_sheet_rate: float
    btts_rate: float
    over_2_5_rate: float

    form: str


class TeamStatisticsService:
    """Calculate and persist recent team performance statistics."""

    COMPLETED_STATUSES = {
        "finished",
        "completed",
        "ft",
        "ended",
        "5",
    }

    STATISTIC_ALIASES: dict[str, tuple[str, ...]] = {
        "possession": (
            "ball_possession",
            "ball_possession_percentage",
            "possession",
        ),
        "shots": (
            "shots_total",
            "total_shots",
            "shots",
        ),
        "shots_on_target": (
            "shots_on_target",
            "shots_ongoal",
            "shots_on_goal",
        ),
        "corners": (
            "corners",
            "corner_kicks",
        ),
        "yellow_cards": (
            "yellowcards",
            "yellow_cards",
        ),
        "red_cards": (
            "redcards",
            "red_cards",
        ),
        "xg": (
            "expected_goals",
            "expected_goals_xg",
            "xg",
        ),
        "xga": (
            "expected_goals_against",
            "xga",
        ),
        "successful_dribbles_percentage": (
            "successful_dribbles_percentage",
            "dribbles_success_percentage",
        ),
    }

    def __init__(self, db: Session) -> None:
        self.db = db

    def calculate(
        self,
        team_id: int,
        limit: int = 10,
    ) -> TeamStatistics:
        """Calculate statistics from the team's latest completed matches."""

        matches = self._get_recent_matches(
            team_id=team_id,
            limit=limit,
        )

        wins = 0
        draws = 0
        losses = 0
        goals_scored = 0
        goals_conceded = 0
        clean_sheets = 0
        btts_matches = 0
        over_2_5_matches = 0
        form_results: list[str] = []

        for match in matches:
            team_goals, opponent_goals = self._extract_team_score(
                match=match,
                team_id=team_id,
            )

            goals_scored += team_goals
            goals_conceded += opponent_goals

            if team_goals > opponent_goals:
                wins += 1
                form_results.append("W")
            elif team_goals == opponent_goals:
                draws += 1
                form_results.append("D")
            else:
                losses += 1
                form_results.append("L")

            if opponent_goals == 0:
                clean_sheets += 1

            if team_goals > 0 and opponent_goals > 0:
                btts_matches += 1

            if team_goals + opponent_goals > 2:
                over_2_5_matches += 1

        matches_played = len(matches)

        if matches_played == 0:
            return TeamStatistics(
                team_id=team_id,
                matches_played=0,
                wins=0,
                draws=0,
                losses=0,
                goals_scored=0,
                goals_conceded=0,
                goals_per_match=0.0,
                goals_conceded_per_match=0.0,
                points_per_match=0.0,
                clean_sheet_rate=0.0,
                btts_rate=0.0,
                over_2_5_rate=0.0,
                form="",
            )

        points = wins * 3 + draws

        return TeamStatistics(
            team_id=team_id,
            matches_played=matches_played,
            wins=wins,
            draws=draws,
            losses=losses,
            goals_scored=goals_scored,
            goals_conceded=goals_conceded,
            goals_per_match=round(goals_scored / matches_played, 3),
            goals_conceded_per_match=round(
                goals_conceded / matches_played,
                3,
            ),
            points_per_match=round(points / matches_played, 3),
            clean_sheet_rate=self._percentage(
                clean_sheets,
                matches_played,
            ),
            btts_rate=self._percentage(
                btts_matches,
                matches_played,
            ),
            over_2_5_rate=self._percentage(
                over_2_5_matches,
                matches_played,
            ),
            form="".join(form_results),
        )

    def update_team_from_recent_matches(
        self,
        team_id: int,
        limit: int = 10,
    ) -> dict[str, Any]:
        """
        Persist score-based and advanced recent statistics.

        Team numeric fields are stored as per-match averages because the
        prediction and rating services consume them in that form.
        """

        team = self.db.get(Team, team_id)

        if team is None:
            raise ValueError(f"Team {team_id} was not found")

        statistics = self.calculate(
            team_id=team_id,
            limit=limit,
        )

        if statistics.matches_played == 0:
            return {
                "team_id": team_id,
                "status": "skipped",
                "reason": "no_completed_matches",
                "matches_used": 0,
            }

        team.wins = statistics.wins
        team.draws = statistics.draws
        team.losses = statistics.losses
        team.form = statistics.form[-5:]
        team.goals_scored = statistics.goals_per_match
        team.goals_conceded = statistics.goals_conceded_per_match
        team.clean_sheets = statistics.clean_sheet_rate
        team.failed_to_score = self._percentage(
            sum(
                1
                for match in self._get_recent_matches(team_id, limit)
                if self._extract_team_score(match, team_id)[0] == 0
            ),
            statistics.matches_played,
        )

        advanced = self._calculate_advanced_statistics(
            team_id=team_id,
            limit=limit,
        )

        for field in (
            "possession",
            "shots",
            "shots_on_target",
            "corners",
            "yellow_cards",
            "red_cards",
            "xg",
            "xga",
        ):
            value = advanced.get(field)
            if value is not None:
                setattr(team, field, value)

        team.attack = self._calculate_attack_rating(team)
        team.defense = self._calculate_defense_rating(team)
        team.midfield = self._calculate_midfield_rating(
            team,
            advanced.get("successful_dribbles_percentage"),
        )

        self.db.flush()

        return {
            "team_id": team_id,
            "status": "updated",
            "matches_used": statistics.matches_played,
            "advanced_matches_used": advanced["matches_used"],
            "wins": statistics.wins,
            "draws": statistics.draws,
            "losses": statistics.losses,
            "form": team.form,
            "goals_scored": team.goals_scored,
            "goals_conceded": team.goals_conceded,
            "clean_sheets": team.clean_sheets,
            "failed_to_score": team.failed_to_score,
            "possession": team.possession,
            "shots": team.shots,
            "shots_on_target": team.shots_on_target,
            "corners": team.corners,
            "yellow_cards": team.yellow_cards,
            "red_cards": team.red_cards,
            "xg": team.xg,
            "xga": team.xga,
            "attack": team.attack,
            "defense": team.defense,
            "midfield": team.midfield,
        }

    def _calculate_advanced_statistics(
        self,
        team_id: int,
        limit: int,
    ) -> dict[str, Any]:
        safe_limit = max(1, min(limit, 100))

        statement = (
            select(MatchStatistic, Match)
            .join(Match, Match.id == MatchStatistic.fixture_id)
            .where(MatchStatistic.team_id == team_id)
            .where(
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(Match.date.desc(), Match.id.desc())
            .limit(safe_limit)
        )

        rows = list(self.db.execute(statement).all())
        rows = [
            (record, match)
            for record, match in rows
            if self._is_completed(match.status)
        ]

        if not rows:
            return {"matches_used": 0}

        fixture_ids = [record.fixture_id for record, _ in rows]
        opponent_statement = select(MatchStatistic).where(
            MatchStatistic.fixture_id.in_(fixture_ids),
            MatchStatistic.team_id != team_id,
        )
        opponent_records = {
            record.fixture_id: record
            for record in self.db.scalars(opponent_statement).all()
        }

        values: dict[str, list[float]] = {
            key: [] for key in self.STATISTIC_ALIASES
        }

        for record, match in rows:
            raw = record.raw_statistics or {}

            self._append_value(
                values["possession"],
                record.possession,
                self._extract_stat(raw, "possession"),
            )
            self._append_value(
                values["corners"],
                record.corners,
                self._extract_stat(raw, "corners"),
            )
            self._append_value(
                values["yellow_cards"],
                record.yellow_cards,
                self._extract_stat(raw, "yellow_cards"),
            )
            self._append_value(
                values["red_cards"],
                record.red_cards,
                self._extract_stat(raw, "red_cards"),
            )

            for field in (
                "shots",
                "shots_on_target",
                "successful_dribbles_percentage",
            ):
                self._append_value(
                    values[field],
                    self._extract_stat(raw, field),
                )

            own_xg = self._extract_stat(raw, "xg")
            self._append_value(values["xg"], own_xg)

            own_xga = self._extract_stat(raw, "xga")
            opponent = opponent_records.get(record.fixture_id)
            opponent_xg = None

            if opponent is not None:
                opponent_xg = self._extract_stat(
                    opponent.raw_statistics or {},
                    "xg",
                )

            _, opponent_goals = self._extract_team_score(match, team_id)
            self._append_value(
                values["xga"],
                own_xga,
                opponent_xg,
                float(opponent_goals),
            )

        result: dict[str, Any] = {
            "matches_used": len(rows),
        }

        for field, samples in values.items():
            average = self._average(samples)
            if average is not None:
                result[field] = average

        return result

    def _get_recent_matches(
        self,
        team_id: int,
        limit: int,
    ) -> list[Match]:
        """Get the most recent completed matches for a team."""

        safe_limit = max(1, min(limit, 100))

        statement = (
            select(Match)
            .where(
                or_(
                    Match.home_team_id == team_id,
                    Match.away_team_id == team_id,
                )
            )
            .where(
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(Match.date.desc(), Match.id.desc())
            .limit(safe_limit)
        )

        matches = list(self.db.scalars(statement).all())

        return [
            match
            for match in matches
            if self._is_completed(match.status)
        ]

    @classmethod
    def _extract_stat(
        cls,
        statistics: dict[str, Any],
        field: str,
    ) -> float | None:
        for key in cls.STATISTIC_ALIASES[field]:
            value = cls._number(statistics.get(key))
            if value is not None:
                return value
        return None

    @staticmethod
    def _append_value(
        target: list[float],
        *candidates: Any,
    ) -> None:
        for candidate in candidates:
            value = TeamStatisticsService._number(candidate)
            if value is not None:
                target.append(value)
                return

    @staticmethod
    def _number(value: Any) -> float | None:
        if value is None or isinstance(value, bool):
            return None

        if isinstance(value, str):
            value = value.replace("%", "").replace(",", ".").strip()
            if not value:
                return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _average(values: Iterable[float]) -> float | None:
        samples = list(values)
        if not samples:
            return None
        return round(sum(samples) / len(samples), 3)

    @classmethod
    def _calculate_attack_rating(cls, team: Team) -> int:
        score = (
            cls._normalize(team.xg, 0.4, 2.8) * 0.35
            + cls._normalize(team.goals_scored, 0.3, 2.6) * 0.30
            + cls._normalize(team.shots, 6.0, 20.0) * 0.15
            + cls._normalize(team.shots_on_target, 2.0, 8.0) * 0.20
        )
        return int(round(cls._clamp(score, 35.0, 99.0)))

    @classmethod
    def _calculate_defense_rating(cls, team: Team) -> int:
        xga_score = 100.0 - cls._normalize(team.xga, 0.4, 2.6)
        conceded_score = 100.0 - cls._normalize(
            team.goals_conceded,
            0.3,
            2.5,
        )
        clean_sheet_score = cls._clamp(float(team.clean_sheets or 0.0), 0.0, 100.0)
        score = (
            xga_score * 0.45
            + conceded_score * 0.35
            + clean_sheet_score * 0.20
        )
        return int(round(cls._clamp(score, 35.0, 99.0)))

    @classmethod
    def _calculate_midfield_rating(
        cls,
        team: Team,
        dribble_success: float | None,
    ) -> int:
        possession_score = cls._normalize(team.possession, 35.0, 65.0)
        corners_score = cls._normalize(team.corners, 2.0, 8.0)
        dribble_score = cls._clamp(
            dribble_success if dribble_success is not None else 50.0,
            0.0,
            100.0,
        )
        score = (
            possession_score * 0.60
            + corners_score * 0.20
            + dribble_score * 0.20
        )
        return int(round(cls._clamp(score, 35.0, 99.0)))

    @staticmethod
    def _normalize(value: Any, minimum: float, maximum: float) -> float:
        numeric = TeamStatisticsService._number(value)
        if numeric is None or maximum <= minimum:
            return 50.0
        return TeamStatisticsService._clamp(
            (numeric - minimum) / (maximum - minimum) * 100.0,
            0.0,
            100.0,
        )

    @staticmethod
    def _clamp(value: float, minimum: float, maximum: float) -> float:
        return max(minimum, min(maximum, value))

    @classmethod
    def _is_completed(cls, status: Any) -> bool:
        if status is None:
            return True
        return str(status).strip().lower() in cls.COMPLETED_STATUSES

    @staticmethod
    def _extract_team_score(
        match: Match,
        team_id: int,
    ) -> tuple[int, int]:
        home_score = int(match.home_score or 0)
        away_score = int(match.away_score or 0)

        if match.home_team_id == team_id:
            return home_score, away_score

        if match.away_team_id == team_id:
            return away_score, home_score

        raise ValueError(
            f"Team {team_id} does not belong to match {match.id}"
        )

    @staticmethod
    def _percentage(amount: int, total: int) -> float:
        if total <= 0:
            return 0.0
        return round(amount / total * 100.0, 2)

