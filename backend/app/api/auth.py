from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
from app.schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    AuthService,
    AuthenticationError,
    AuthServiceError,
    InactiveUserError,
    RegistrationConflictError,
)
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)
def build_auth_user_response(
    service: AuthService,
    user: User,
) -> AuthUserResponse:
    subscription = service.get_active_subscription(
        user.id,
    )
    user_data = UserResponse.model_validate(
        user,
    ).model_dump()
    return AuthUserResponse.model_validate(
        {
            **user_data,
            "subscription": subscription,
        }
    )
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    service = AuthService(db)
    try:
        user = service.register(payload)
        return UserResponse.model_validate(user)
    except RegistrationConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    except AuthServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error
@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> dict:
    service = AuthService(db)
    try:
        user = service.authenticate(
            payload.identifier,
            payload.password,
        )
        tokens = service.issue_tokens(user)
        return {
            **tokens,
            "user": build_auth_user_response(
                service,
                user,
            ),
        }
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
@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> dict:
    service = AuthService(db)
    try:
        user, tokens = service.refresh_access_token(
            payload.refresh_token,
        )
        return {
            **tokens,
            "user": build_auth_user_response(
                service,
                user,
            ),
        }
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
@router.get(
    "/me",
    response_model=AuthUserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuthUserResponse:
    service = AuthService(db)
    return build_auth_user_response(
        service,
        current_user,
    )
