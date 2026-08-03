from sqlalchemy import text

from app.core.database import SessionLocal


def check_database():

    try:

        db = SessionLocal()

        db.execute(text("SELECT 1"))

        db.close()

        return {
            "status": "healthy"
        }

    except Exception as exc:

        return {
            "status": "unhealthy",
            "error": str(exc),
        }
