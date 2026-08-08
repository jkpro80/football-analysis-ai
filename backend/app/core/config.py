from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Football Analysis AI"
    app_version: str = "1.0.0"

    environment: str = "development"
    debug: bool = False

    database_url: str
    admin_api_key: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    sportmonks_api_key: str | None = None
    sportmonks_api_token: str | None = None
    sportmonks_base_url: str | None = None

    debug_sportmonks_fixtures: bool = False

    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
