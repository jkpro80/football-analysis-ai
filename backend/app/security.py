
import secrets

from app.core.config import settings
from fastapi import Header, HTTPException, status




def verify_admin_api_key(
    x_admin_key: str | None = Header(default=None),
) -> None:
    expected_key = settings.admin_api_key

    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ADMIN_API_KEY is not configured.",
        )

    if (
        not x_admin_key
        or not secrets.compare_digest(
            x_admin_key,
            expected_key,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized.",
        )

