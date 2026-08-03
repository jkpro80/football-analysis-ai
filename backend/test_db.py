from app.database import engine

try:
    with engine.connect() as conn:
        print("Connected Successfully")
except Exception as e:
    print(e)