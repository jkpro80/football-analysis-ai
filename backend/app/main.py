from app.core.config import settings
from app.core.logging import logger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.system_update import router as system_update_router
from app.database.database import SessionLocal
from app.api.backtest import router as backtest_router
from app.api.elo import router as elo_router
from app.api.features import router as features_router
from app.api.matches import router as matches_router
from app.api.model import router as model_router
from app.api.system_jobs import router as system_jobs_router


from app.api.sportmonks import router as sportmonks_router
from app.api.standings import router as standings_router
from app.api.sync import router as sync_router
from app.api.team_statistics import router as team_statistics_router
from app.api.teams import router as teams_router

from app.api.predictions import router as prediction_router
from app.api.latest.router import router as latest_prediction_router
logger.info("Application started")

app = FastAPI(
    title=settings.app_name,
    description=(
        "Football match analysis, statistics, "
        "backtesting, and prediction API."
    ),
    version=settings.app_version,
    root_path="/api",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Core data APIs
app.include_router(teams_router)
app.include_router(team_statistics_router)
app.include_router(matches_router)
app.include_router(latest_prediction_router)
app.include_router(prediction_router)
# Prediction APIs
app.include_router(standings_router)
app.include_router(system_update_router)
# Backtesting and optimization
app.include_router(backtest_router)

app.include_router(system_jobs_router)
# Model and feature APIs
app.include_router(model_router)
app.include_router(elo_router)
app.include_router(features_router)

# External data and synchronization
app.include_router(sportmonks_router)
app.include_router(sync_router)


@app.get(
    "/",
    tags=["System"],
)
def root() -> dict[str, str]:
    return {
        "message": "Football Analysis AI API is running"
    }


@app.get(
    "/health",
    tags=["System"],
)
def health() -> dict[str, str]:
    return {
        "status": "ok"
    }
@app.get(
    "/system/status",
    tags=["System"],
)
def system_status() -> dict[str, str]:
    """
    فحص حالة الـBackend وقاعدة البيانات
    ومحرك التوقعات.
    """

    database_status = "disconnected"
    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))
        database_status = "connected"

    except SQLAlchemyError:
        database_status = "disconnected"

    finally:
        db.close()

    prediction_engine_status = (
    "Prediction Engine V11 Ready"
    if database_status == "connected"
    else "Unavailable"
)
    overall_status = (
        "ok"
        if database_status == "connected"
        else "degraded"
    )

    return {
        "status": overall_status,
        "backend": "online",
        "database": database_status,
        "prediction_engine": prediction_engine_status,
    }









