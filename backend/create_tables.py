from app.database import Base, engine

# استيراد جميع الـ Models
import app.database.models  # noqa: F401

Base.metadata.create_all(bind=engine)

print("All tables created successfully.")