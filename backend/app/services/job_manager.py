import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.database.models import SystemJob


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_job(
    db: Session,
    job_type: str,
    message: str | None = None,
) -> SystemJob:
    job = SystemJob(
        job_type=job_type,
        status="pending",
        progress=0,
        message=message or "Job created.",
        created_at=utc_now(),
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


def start_job(
    db: Session,
    job: SystemJob,
    message: str | None = None,
) -> SystemJob:
    job.status = "running"
    job.progress = 0
    job.started_at = utc_now()
    job.completed_at = None
    job.error_message = None

    if message is not None:
        job.message = message

    db.commit()
    db.refresh(job)

    return job


def update_job_progress(
    db: Session,
    job: SystemJob,
    progress: int,
    message: str | None = None,
) -> SystemJob:
    normalized_progress = max(0, min(100, progress))

    job.progress = normalized_progress

    if message is not None:
        job.message = message

    db.commit()
    db.refresh(job)

    return job


def complete_job(
    db: Session,
    job: SystemJob,
    result: Any = None,
    message: str | None = None,
) -> SystemJob:
    job.status = "completed"
    job.progress = 100
    job.completed_at = utc_now()
    job.error_message = None

    if message is not None:
        job.message = message
    else:
        job.message = "Job completed successfully."

    if result is not None:
        job.result_json = json.dumps(
            result,
            ensure_ascii=False,
            default=str,
        )

    db.commit()
    db.refresh(job)

    return job


def fail_job(
    db: Session,
    job: SystemJob,
    error: Exception | str,
    message: str | None = None,
) -> SystemJob:
    error_text = str(error)

    job.status = "failed"
    job.completed_at = utc_now()
    job.error_message = error_text

    if message is not None:
        job.message = message
    else:
        job.message = "Job failed."

    db.commit()
    db.refresh(job)

    return job


def get_job(
    db: Session,
    job_id: int,
) -> SystemJob | None:
    return (
        db.query(SystemJob)
        .filter(SystemJob.id == job_id)
        .first()
    )


def get_jobs(
    db: Session,
    limit: int = 50,
    status: str | None = None,
    job_type: str | None = None,
) -> list[SystemJob]:
    query = db.query(SystemJob)

    if status:
        query = query.filter(SystemJob.status == status)

    if job_type:
        query = query.filter(SystemJob.job_type == job_type)

    return (
        query.order_by(SystemJob.created_at.desc())
        .limit(limit)
        .all()
    )


def delete_job(
    db: Session,
    job: SystemJob,
) -> None:
    db.delete(job)
    db.commit()