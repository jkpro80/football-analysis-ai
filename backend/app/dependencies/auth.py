from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.services.auth_service import (
    AuthService,
    AuthenticationError,
    InactiveUserError,
)
bearer_scheme = HTTPBearer(
    auto_error=False,
)
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme,
    ),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )
    service = AuthService(db)
    try:
        return service.get_user_from_token(
            credentials.credentials,
            expected_type=AuthService.ACCESS_TOKEN_TYPE,
        )
    except InactiveUserError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error
    except AuthenticationError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from error
def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme,
    ),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Returns the authenticated user if a valid Bearer token is supplied.
    Returns None when no Authorization header is provided.
    Still rejects invalid or expired tokens.
    """
    if credentials is None:
        return None
    service = AuthService(db)
    try:
        return service.get_user_from_token(
            credentials.credentials,
            expected_type=AuthService.ACCESS_TOKEN_TYPE,
        )
    except (AuthenticationError, InactiveUserError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )
