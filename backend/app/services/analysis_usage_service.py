from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database.models import AnalysisUsage
class AnalysisUsageService:
    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")
        self.db = db
    @staticmethod
    def current_month_start() -> datetime:
        now = datetime.now(timezone.utc)
        return datetime(
            year=now.year,
            month=now.month,
            day=1,
            tzinfo=timezone.utc,
        )
    def get_monthly_usage(
        self,
        user_id: int,
    ) -> int:
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        month_start = self.current_month_start()
        statement = select(
            func.count(AnalysisUsage.id)
        ).where(
            AnalysisUsage.user_id == user_id,
            AnalysisUsage.created_at >= month_start,
        )
        count = self.db.scalar(statement)
        return int(count or 0)
    def record_usage(
        self,
        *,
        user_id: int,
        match_id: int,
    ) -> AnalysisUsage:
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        match_id = self._positive_integer(
            match_id,
            field_name="match_id",
        )
        usage = AnalysisUsage(
            user_id=user_id,
            match_id=match_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(usage)
        try:
            self.db.commit()
            self.db.refresh(usage)
        except Exception:
            self.db.rollback()
            raise
        return usage
    def get_remaining(
        self,
        *,
        user_id: int,
        analysis_limit: int | None,
    ) -> int | None:
        if analysis_limit is None:
            return None
        if analysis_limit < 0:
            raise ValueError(
                "analysis_limit cannot be negative.",
            )
        used = self.get_monthly_usage(
            user_id=user_id,
        )
        return max(
            analysis_limit - used,
            0,
        )
    def has_available_quota(
        self,
        *,
        user_id: int,
        analysis_limit: int | None,
    ) -> bool:
        if analysis_limit is None:
            return True
        return (
            self.get_monthly_usage(user_id)
            < analysis_limit
        )
    @staticmethod
    def _positive_integer(
        value: int,
        *,
        field_name: str,
    ) -> int:
        if isinstance(value, bool):
            raise ValueError(
                f"{field_name} must be a positive integer.",
            )
        try:
            normalized = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} must be a positive integer.",
            ) from exc
        if normalized <= 0:
            raise ValueError(
                f"{field_name} must be a positive integer.",
            )
        return normalized
