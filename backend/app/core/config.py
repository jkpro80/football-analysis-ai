from functools import lru_cache

from pydantic import Field
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

    sportmonks_competition_scope: dict[str, dict[str, int]] = Field(
        default_factory=lambda: {
            "premier_league": {
                "league_id": 8,
                "season_id": 28083,
            },
            "la_liga": {
                "league_id": 564,
                "season_id": 27965,
            },
            "serie_a": {
                "league_id": 384,
                "season_id": 27895,
            },
            "bundesliga": {
                "league_id": 82,
                "season_id": 28321,
            },
            "ligue_1": {
                "league_id": 301,
                "season_id": 28082,
            },
        }
    )

    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_pro_price_id: str | None = None
    stripe_premium_price_id: str | None = None

    # Email / password reset
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str = "MALX"
    smtp_use_starttls: bool = True

    frontend_base_url: str = "https://xn--mlx-ula.com"
    password_reset_expire_minutes: int = 30

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




