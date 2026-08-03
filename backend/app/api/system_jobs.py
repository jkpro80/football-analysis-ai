from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import SystemJob
from app.security import verify_admin_api_key
from app.services.job_manager import get_job, get_jobs

router = APIRouter(
    prefix="/system/jobs",
    tags=["System Jobs"],
    dependencies=[Depends(verify_admin_api_key)],
)


@router.get("")
def list_jobs(
    limit: int = 50,
    status: str | None = None,
    job_type: str | None = None,
    db: Session = Depends(get_db),
):
    jobs = get_jobs(
        db=db,
        limit=limit,
        status=status,
        job_type=job_type,
    )

    return jobs


@router.get("/{job_id}")
def read_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = get_job(db, job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return job