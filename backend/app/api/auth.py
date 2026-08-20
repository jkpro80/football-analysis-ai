from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
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
    PasswordResetError,
    RegistrationConflictError,
)
from app.services.email_service import (
    EmailService,
    EmailServiceError,
)
from app.core.logging import logger
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
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    service = AuthService(db)

    try:
        user, reset_token = (
            service.create_password_reset_token(
                email=str(payload.email),
            )
        )

        if user is not None and reset_token is not None:
            try:
                EmailService().send_password_reset(
                    recipient_email=user.email,
                    reset_token=reset_token,
                )
            except EmailServiceError:
                logger.exception(
                    "Password reset email delivery failed "
                    "for user_id=%s",
                    user.id,
                )

    except Exception:
        logger.exception(
            "Password reset request failed."
        )

    # Always return the same response to prevent
    # account enumeration.
    return {
        "message": (
            "If an account exists for this email, "
            "a password reset link will be sent."
        )
    }


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    service = AuthService(db)

    try:
        service.reset_password(
            token=payload.token,
            new_password=payload.new_password,
        )
    except PasswordResetError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return {
        "message": "Password changed successfully."
    }


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
