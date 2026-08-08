from datetime import datetime
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(
        min_length=3,
        max_length=100,
        pattern=r"^[A-Za-z0-9_.-]+$",
    )
    full_name: str = Field(
        min_length=2,
        max_length=200,
    )
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()
    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()
    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("Full name is required.")
        return normalized
    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.islower() for character in value):
            raise ValueError(
                "Password must include a lowercase letter."
            )
        if not any(character.isupper() for character in value):
            raise ValueError(
                "Password must include an uppercase letter."
            )
        if not any(character.isdigit() for character in value):
            raise ValueError(
                "Password must include a number."
            )
        return value
class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=3,
        max_length=320,
    )
    password: str = Field(
        min_length=1,
        max_length=128,
    )
    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()
class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(
        min_length=20,
    )
class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )
    id: int
    email: EmailStr
    username: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
class SubscriptionPlanResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )
    id: int
    code: str
    name: str
    description: str | None
    monthly_price: float
    currency: str
    analysis_limit: int | None
    is_active: bool
class UserSubscriptionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )
    id: int
    status: str
    starts_at: datetime
    ends_at: datetime | None
    auto_renew: bool
    plan: SubscriptionPlanResponse
class AuthUserResponse(UserResponse):
    subscription: UserSubscriptionResponse | None = None
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUserResponse
