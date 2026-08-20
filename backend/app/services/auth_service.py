from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4
import hashlib
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.models import (
    PasswordResetToken,
    SubscriptionPlan,
    User,
    UserSubscription,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest
password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)
class AuthServiceError(Exception):
    """Base authentication service error."""
class AuthenticationError(AuthServiceError):
    """Raised when supplied credentials or tokens are invalid."""
class RegistrationConflictError(AuthServiceError):
    """Raised when an email or username already exists."""
class InactiveUserError(AuthServiceError):
    """Raised when authentication is attempted by an inactive user."""


class PasswordResetError(AuthServiceError):
    """Raised when a password reset token is invalid or expired."""


class AuthService:
    ACCESS_TOKEN_TYPE = "access"
    REFRESH_TOKEN_TYPE = "refresh"
    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("db is required")
        self.db = db
        self.users = UserRepository(db)
    @staticmethod
    def hash_password(password: str) -> str:
        return password_context.hash(password)
    @staticmethod
    def verify_password(
        plain_password: str,
        password_hash: str,
    ) -> bool:
        try:
            return password_context.verify(
                plain_password,
                password_hash,
            )
        except (TypeError, ValueError):
            return False
    @staticmethod
    def _utc_now() -> datetime:
        return datetime.now(timezone.utc)
    def _create_token(
        self,
        *,
        user: User,
        token_type: str,
        expires_delta: timedelta,
    ) -> str:
        now = self._utc_now()
        expires_at = now + expires_delta
        payload: dict[str, Any] = {
            "sub": str(user.id),
            "type": token_type,
            "role": user.role,
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "jti": uuid4().hex,
        }
        return jwt.encode(
            payload,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )
    def create_access_token(self, user: User) -> str:
        return self._create_token(
            user=user,
            token_type=self.ACCESS_TOKEN_TYPE,
            expires_delta=timedelta(
                minutes=settings.access_token_expire_minutes,
            ),
        )
    def create_refresh_token(self, user: User) -> str:
        return self._create_token(
            user=user,
            token_type=self.REFRESH_TOKEN_TYPE,
            expires_delta=timedelta(
                days=settings.refresh_token_expire_days,
            ),
        )
    def decode_token(
        self,
        token: str,
        *,
        expected_type: str,
    ) -> dict[str, Any]:
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
                options={
                    "require_sub": True,
                    "require_exp": True,
                },
            )
        except JWTError as error:
            raise AuthenticationError(
                "Invalid or expired token."
            ) from error
        if payload.get("type") != expected_type:
            raise AuthenticationError(
                "Invalid token type."
            )
        subject = payload.get("sub")
        if not subject:
            raise AuthenticationError(
                "Token subject is missing."
            )
        try:
            int(subject)
        except (TypeError, ValueError) as error:
            raise AuthenticationError(
                "Invalid token subject."
            ) from error
        return payload
    def get_user_from_token(
        self,
        token: str,
        *,
        expected_type: str,
    ) -> User:
        payload = self.decode_token(
            token,
            expected_type=expected_type,
        )
        user = self.users.get_by_id(
            int(payload["sub"]),
        )
        if user is None:
            raise AuthenticationError(
                "User no longer exists."
            )
        if not user.is_active:
            raise InactiveUserError(
                "User account is inactive."
            )
        return user
    def register(
        self,
        payload: RegisterRequest,
    ) -> User:
        email = str(payload.email).strip().lower()
        username = payload.username.strip().lower()
        if self.users.get_by_email(email) is not None:
            raise RegistrationConflictError(
                "Email is already registered."
            )
        if self.users.get_by_username(username) is not None:
            raise RegistrationConflictError(
                "Username is already registered."
            )
        free_plan = (
            self.db.query(SubscriptionPlan)
            .filter(
                SubscriptionPlan.code == "free",
                SubscriptionPlan.is_active.is_(True),
            )
            .first()
        )
        if free_plan is None:
            raise AuthServiceError(
                "The free subscription plan is not configured."
            )
        user = User(
            email=email,
            username=username,
            full_name=payload.full_name,
            password_hash=self.hash_password(
                payload.password,
            ),
            role="user",
            is_active=True,
            is_verified=False,
        )
        try:
            self.db.add(user)
            self.db.flush()
            subscription = UserSubscription(
                user_id=user.id,
                plan_id=free_plan.id,
                status="active",
                starts_at=self._utc_now(),
                ends_at=None,
                auto_renew=False,
            )
            self.db.add(subscription)
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError as error:
            self.db.rollback()
            raise RegistrationConflictError(
                "Email or username is already registered."
            ) from error
        except Exception:
            self.db.rollback()
            raise
        return user
    def authenticate(
        self,
        identifier: str,
        password: str,
    ) -> User:
        user = self.users.get_by_identifier(
            identifier,
        )
        if user is None:
            raise AuthenticationError(
                "Invalid email, username, or password."
            )
        if not self.verify_password(
            password,
            user.password_hash,
        ):
            raise AuthenticationError(
                "Invalid email, username, or password."
            )
        if not user.is_active:
            raise InactiveUserError(
                "User account is inactive."
            )
        return user
    def issue_tokens(
        self,
        user: User,
    ) -> dict[str, Any]:
        return {
            "access_token": self.create_access_token(user),
            "refresh_token": self.create_refresh_token(user),
            "token_type": "bearer",
            "expires_in": (
                settings.access_token_expire_minutes * 60
            ),
        }
    def refresh_access_token(
        self,
        refresh_token: str,
    ) -> tuple[User, dict[str, Any]]:
        user = self.get_user_from_token(
            refresh_token,
            expected_type=self.REFRESH_TOKEN_TYPE,
        )
        return user, self.issue_tokens(user)
    @staticmethod
    def _hash_reset_token(token: str) -> str:
        if not isinstance(token, str):
            raise PasswordResetError(
                "Invalid password reset token."
            )

        normalized = token.strip()

        if not normalized:
            raise PasswordResetError(
                "Invalid password reset token."
            )

        return hashlib.sha256(
            normalized.encode("utf-8")
        ).hexdigest()

    def create_password_reset_token(
        self,
        *,
        email: str,
    ) -> tuple[User | None, str | None]:
        normalized_email = email.strip().lower()

        if not normalized_email:
            raise ValueError("email is required.")

        user = self.users.get_by_email(
            normalized_email,
        )

        # Do not reveal whether an account exists.
        if user is None or not user.is_active:
            return None, None

        now = self._utc_now()

        (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None),
            )
            .update(
                {
                    PasswordResetToken.used_at: now,
                },
                synchronize_session=False,
            )
        )

        raw_token = secrets.token_urlsafe(48)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=self._hash_reset_token(
                raw_token,
            ),
            expires_at=(
                now
                + timedelta(
                    minutes=(
                        settings.password_reset_expire_minutes
                    ),
                )
            ),
            used_at=None,
            created_at=now,
        )

        try:
            self.db.add(reset_token)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return user, raw_token

    def reset_password(
        self,
        *,
        token: str,
        new_password: str,
    ) -> User:
        token_hash = self._hash_reset_token(
            token,
        )

        now = self._utc_now()

        reset_token = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token_hash
                == token_hash,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > now,
            )
            .first()
        )

        if reset_token is None:
            raise PasswordResetError(
                "Invalid or expired password reset token."
            )

        user = self.users.get_by_id(
            reset_token.user_id,
        )

        if user is None or not user.is_active:
            raise PasswordResetError(
                "Invalid or expired password reset token."
            )

        user.password_hash = self.hash_password(
            new_password,
        )
        user.updated_at = now
        reset_token.used_at = now

        # Invalidate every other outstanding reset token
        # for this user as soon as the password changes.
        (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.id
                != reset_token.id,
                PasswordResetToken.used_at.is_(None),
            )
            .update(
                {
                    PasswordResetToken.used_at: now,
                },
                synchronize_session=False,
            )
        )

        try:
            self.db.commit()
            self.db.refresh(user)
        except Exception:
            self.db.rollback()
            raise

        return user

    def get_active_subscription(
        self,
        user_id: int,
    ) -> UserSubscription | None:
        now = self._utc_now()
        return (
            self.db.query(UserSubscription)
            .filter(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active",
                (
                    UserSubscription.ends_at.is_(None)
                    | (UserSubscription.ends_at > now)
                ),
            )
            .order_by(
                UserSubscription.starts_at.desc(),
                UserSubscription.id.desc(),
            )
            .first()
        )
