from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    BigInteger,
    Integer,
    String,
UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sportmonks_id = Column(
        Integer,
        unique=True,
        nullable=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    country = Column(
        String(100),
        nullable=False,
    )
    logo_url = Column(
        String(500),
        nullable=True,
    )
    attack = Column(
        Integer,
        default=80,
    )

    defense = Column(
        Integer,
        default=80,
    )

    midfield = Column(
        Integer,
        default=80,
    )

    elo = Column(
        Integer,
        default=1800,
    )

    home_advantage = Column(
        Float,
        default=1.10,
    )

    goals_scored = Column(
        Float,
        default=1.5,
    )

    goals_conceded = Column(
        Float,
        default=1.0,
    )

    form = Column(
        String(5),
        default="WWWWW",
    )

    wins = Column(
        Integer,
        default=0,
    )

    draws = Column(
        Integer,
        default=0,
    )

    losses = Column(
        Integer,
        default=0,
    )

    possession = Column(
        Float,
        default=50.0,
    )

    shots = Column(
        Float,
        default=12.0,
    )

    shots_on_target = Column(
        Float,
        default=5.0,
    )

    corners = Column(
        Float,
        default=5.0,
    )

    yellow_cards = Column(
        Float,
        default=2.0,
    )

    fouls = Column(
        Float,
        default=11.0,
        nullable=True,
    )

    red_cards = Column(
        Float,
        default=0.1,
    )

    clean_sheets = Column(
        Float,
        default=30.0,
    )

    failed_to_score = Column(
        Float,
        default=20.0,
    )

    xg = Column(
        Float,
        default=1.50,
    )

    xga = Column(
        Float,
        default=1.00,
    )

    home_matches = relationship(
        "Match",
        foreign_keys="Match.home_team_id",
        back_populates="home_team",
    )

    away_matches = relationship(
        "Match",
        foreign_keys="Match.away_team_id",
        back_populates="away_team",
    )


class Match(Base):
    __tablename__ = "matches"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sportmonks_id = Column(
        Integer,
        unique=True,
        nullable=True,
        index=True,
    )

    home_team_id = Column(
        Integer,
        ForeignKey("teams.id"),
        nullable=False,
    )

    away_team_id = Column(
        Integer,
        ForeignKey("teams.id"),
        nullable=False,
    )

    date = Column(
        DateTime(timezone=False),
        nullable=False,
    )

    status = Column(
        String(30),
        default="scheduled",
    )

    home_score = Column(
        Integer,
        nullable=True,
    )

    away_score = Column(
        Integer,
        nullable=True,
    )
         # Competition
    league_name = Column(String(255), nullable=True)
    league_logo = Column(String(500), nullable=True)
    season_name = Column(String(255), nullable=True)
    round_name = Column(String(255), nullable=True)
    stage_name = Column(String(255), nullable=True)

    # Venue
    venue_name = Column(String(255), nullable=True)
    venue_city = Column(String(255), nullable=True)
    venue_capacity = Column(Integer, nullable=True)
    venue_image = Column(String(500), nullable=True)

# Referee
    referee_name = Column(String(255), nullable=True)

    home_team = relationship(
        "Team",
        foreign_keys=[home_team_id],
        back_populates="home_matches",
    )

    away_team = relationship(
        "Team",
        foreign_keys=[away_team_id],
        back_populates="away_matches",
    )

    prediction_records = relationship(
        "PredictionRecord",
        back_populates="match",
        cascade="all, delete-orphan",
    )


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    match_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    model_version = Column(
        String(50),
        nullable=False,
        default="Poisson + Elo V2",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    expected_home_goals = Column(
        Float,
        nullable=False,
    )

    expected_away_goals = Column(
        Float,
        nullable=False,
    )

    expected_total_goals = Column(
        Float,
        nullable=False,
    )

    home_win_probability = Column(
        Float,
        nullable=False,
    )

    draw_probability = Column(
        Float,
        nullable=False,
    )

    away_win_probability = Column(
        Float,
        nullable=False,
    )

    over_2_5_probability = Column(
        Float,
        nullable=False,
    )

    btts_probability = Column(
        Float,
        nullable=False,
    )

    predicted_score = Column(
        String(20),
        nullable=True,
    )

    best_pick_key = Column(
        String(100),
        nullable=True,
    )

    best_pick_label = Column(
        String(200),
        nullable=True,
    )

    best_pick_probability = Column(
        Float,
        nullable=True,
    )

    confidence = Column(
        String(30),
        nullable=False,
    )

    confidence_score = Column(
        Integer,
        nullable=False,
    )

    actual_home_score = Column(
        Integer,
        nullable=True,
    )

    actual_away_score = Column(
        Integer,
        nullable=True,
    )

    actual_result = Column(
        String(20),
        nullable=True,
    )

    evaluated = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    result_prediction_correct = Column(
        Boolean,
        nullable=True,
    )

    over_2_5_correct = Column(
        Boolean,
        nullable=True,
    )

    btts_correct = Column(
        Boolean,
        nullable=True,
    )

    exact_score_correct = Column(
        Boolean,
        nullable=True,
    )

    home_goals_error = Column(
        Float,
        nullable=True,
    )

    away_goals_error = Column(
        Float,
        nullable=True,
    )

    total_goals_error = Column(
        Float,
        nullable=True,
    )

    match = relationship(
        "Match",
        back_populates="prediction_records",
    )

class MatchStatistic(Base):
    __tablename__ = "match_statistics"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    fixture_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    possession = Column(
        Float,
        nullable=True,
    )

    corners = Column(
        Float,
        nullable=True,
    )

    goals = Column(
        Float,
        nullable=True,
    )

    yellow_cards = Column(
        Float,
        nullable=True,
    )

    fouls = Column(
        Float,
        nullable=True,
    )

    red_cards = Column(
        Float,
        nullable=True,
    )

    assists = Column(
        Float,
        nullable=True,
    )

    successful_dribbles_percentage = Column(
        Float,
        nullable=True,
    )

    raw_statistics = Column(
        JSONB,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(
            timezone.utc
        ),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(
            timezone.utc
        ),
        onupdate=lambda: datetime.now(
            timezone.utc
        ),
        nullable=False,
    )

    team = relationship("Team")

    match = relationship("Match")
    
    
    
    
class EloHistory(Base):
    __tablename__ = "elo_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    match_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    home_team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    away_team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    home_elo_before = Column(
        Integer,
        nullable=False,
    )

    away_elo_before = Column(
        Integer,
        nullable=False,
    )

    home_elo_change = Column(
        Integer,
        nullable=False,
    )

    away_elo_change = Column(
        Integer,
        nullable=False,
    )

    home_elo_after = Column(
        Integer,
        nullable=False,
    )

    away_elo_after = Column(
        Integer,
        nullable=False,
    )

    result = Column(
        String(20),
        nullable=False,
    )

    goal_difference = Column(
        Integer,
        nullable=False,
        default=0,
    )

    applied_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    match = relationship(
        "Match",
    )

    home_team = relationship(
        "Team",
        foreign_keys=[home_team_id],
    )

    away_team = relationship(
        "Team",
        foreign_keys=[away_team_id],
    )


class SystemJob(Base):
    __tablename__ = "system_jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    job_type = Column(
        String(100),
        nullable=False,
        index=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="pending",
        index=True,
    )

    progress = Column(
        Integer,
        nullable=False,
        default=0,
    )

    message = Column(
        String(500),
        nullable=True,
    )

    result_json = Column(
        String,
        nullable=True,
    )

    error_message = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )


class FixtureLineup(Base):
    __tablename__ = "fixture_lineups"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sportmonks_lineup_id = Column(
        BigInteger,
        unique=True,
        nullable=False,
        index=True,
    )

    fixture_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    player_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    player_name = Column(
        String(200),
        nullable=False,
    )

    player_image = Column(
        String(500),
        nullable=True,
    )

    position_id = Column(
        Integer,
        nullable=True,
    )

    position_name = Column(
        String(100),
        nullable=True,
    )

    jersey_number = Column(
        Integer,
        nullable=True,
    )

    lineup_type_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    formation_field = Column(
        String(20),
        nullable=True,
    )

    formation_position = Column(
        Integer,
        nullable=True,
    )

    formation = Column(
        String(30),
        nullable=True,
    )

    is_predicted = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    synced_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class FixtureAbsence(Base):
    __tablename__ = "fixture_absences"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sportmonks_absence_id = Column(
        Integer,
        unique=True,
        nullable=False,
        index=True,
    )

    fixture_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    player_id = Column(
        Integer,
        nullable=False,
        index=True,
    )

    player_name = Column(
        String(200),
        nullable=False,
    )

    player_image = Column(
        String(500),
        nullable=True,
    )

    position_id = Column(
        Integer,
        nullable=True,
    )

    absence_type_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    absence_name = Column(
        String(200),
        nullable=True,
    )

    absence_code = Column(
        String(150),
        nullable=True,
    )

    absence_category = Column(
        String(50),
        nullable=False,
        default="injury",
    )

    synced_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class FixtureWeather(Base):
    __tablename__ = "fixture_weather"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    fixture_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
        index=True,
    )

    sportmonks_weather_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    venue_id = Column(
        Integer,
        nullable=True,
    )

    temperature = Column(
        Float,
        nullable=True,
    )

    feels_like = Column(
        Float,
        nullable=True,
    )

    wind_speed = Column(
        Float,
        nullable=True,
    )

    wind_direction = Column(
        Integer,
        nullable=True,
    )

    humidity = Column(
        Float,
        nullable=True,
    )

    pressure = Column(
        Integer,
        nullable=True,
    )

    clouds = Column(
        Float,
        nullable=True,
    )

    description = Column(
        String(200),
        nullable=True,
    )

    icon_url = Column(
        String(500),
        nullable=True,
    )

    report_type = Column(
        String(50),
        nullable=True,
    )

    metric = Column(
        String(30),
        nullable=True,
    )

    synced_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
class User(Base):
    __tablename__ = "users"
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    email = Column(
        String(320),
        nullable=False,
        unique=True,
        index=True,
    )
    username = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )
    full_name = Column(
        String(200),
        nullable=False,
    )
    password_hash = Column(
        String(255),
        nullable=False,
    )
    role = Column(
        String(30),
        nullable=False,
        default="user",
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )
    is_verified = Column(
        Boolean,
        nullable=False,
        default=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    subscriptions = relationship(
        "UserSubscription",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    analysis_usage = relationship(
        "AnalysisUsage",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    token_hash = Column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
    )
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    used_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship(
        "User",
        back_populates="password_reset_tokens",
    )


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    code = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )
    name = Column(
        String(100),
        nullable=False,
    )
    description = Column(
        String(500),
        nullable=True,
    )
    monthly_price = Column(
        Float,
        nullable=False,
        default=0.0,
    )
    currency = Column(
        String(10),
        nullable=False,
        default="USD",
    )
    analysis_limit = Column(
        Integer,
        nullable=True,
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    subscriptions = relationship(
        "UserSubscription",
        back_populates="plan",
    )
class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    plan_id = Column(
        Integer,
        ForeignKey(
            "subscription_plans.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )
    status = Column(
        String(30),
        nullable=False,
        default="active",
        index=True,
    )
    starts_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    ends_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    auto_renew = Column(
        Boolean,
        nullable=False,
        default=False,
    )
    billing_status = Column(
        String(30),
        nullable=False,
        default="current",
        index=True,
    )
    last_invoice_id = Column(
        String(255),
        nullable=True,
        index=True,
    )
    last_payment_failed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    user = relationship(
        "User",
        back_populates="subscriptions",
    )
    plan = relationship(
        "SubscriptionPlan",
        back_populates="subscriptions",
    )
class ProviderWebhookEvent(Base):
    __tablename__ = "provider_webhook_events"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "event_id",
            name="uq_provider_webhook_events_provider_event_id",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    provider = Column(
        String(50),
        nullable=False,
        index=True,
    )

    event_id = Column(
        String(255),
        nullable=False,
        index=True,
    )

    event_type = Column(
        String(100),
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="received",
        index=True,
    )

    received_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    processed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_payment_id",
            name="uq_payments_provider_payment_id",
        ),
    )
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )
    plan_id = Column(
        Integer,
        ForeignKey(
            "subscription_plans.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )
    provider = Column(
        String(50),
        nullable=False,
        index=True,
    )
    provider_payment_id = Column(
        String(255),
        nullable=True,
    )
    provider_customer_id = Column(
        String(255),
        nullable=True,
        index=True,
    )
    provider_subscription_id = Column(
        String(255),
        nullable=True,
        index=True,
    )
    status = Column(
        String(30),
        nullable=False,
        default="pending",
        index=True,
    )
    amount_minor = Column(
        BigInteger,
        nullable=False,
    )
    currency = Column(
        String(10),
        nullable=False,
        default="USD",
    )
    idempotency_key = Column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )
    failure_code = Column(
        String(100),
        nullable=True,
    )
    failure_message = Column(
        String(500),
        nullable=True,
    )
    paid_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    user = relationship(
        "User",
    )
    plan = relationship(
        "SubscriptionPlan",
    )

class AnalysisUsage(Base):
    __tablename__ = "analysis_usage"
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    match_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    user = relationship(
        "User",
        back_populates="analysis_usage",
    )
    match = relationship(
        "Match",
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    notification_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    message = Column(
        String(1000),
        nullable=False,
    )

    link = Column(
        String(500),
        nullable=True,
    )

    data = Column(
        JSONB,
        nullable=True,
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    read_at = Column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    user = relationship(
        "User",
        back_populates="notifications",
    )



class FavoriteMatch(Base):
    __tablename__ = "favorite_matches"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    match_id = Column(
        Integer,
        ForeignKey(
            "matches.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "match_id",
            name="uq_favorite_matches_user_match",
        ),
    )

    user = relationship(
        "User",
    )

    match = relationship(
        "Match",
    )
