import json

from app.database.database import SessionLocal
from app.services.backtest_v11_service import BacktestV11Service


db = SessionLocal()

try:
    service = BacktestV11Service(db)

    result = service.run(
        limit=5,
        history_limit=5,
        include_details=True,
    )

    with open(
        "backtest_v11_sample.json",
        "w",
        encoding="utf-8",
    ) as output_file:
        json.dump(
            result,
            output_file,
            ensure_ascii=False,
            indent=2,
            default=str,
        )

    print("Created backtest_v11_sample.json")
    print("Status:", result.get("status"))
    print("Model:", result.get("model"))
    print("Sample:", result.get("sample"))
    print("Metrics:", result.get("metrics"))
    print("Failures:", len(result.get("failures", [])))

except Exception as exc:
    db.rollback()
    print(f"{type(exc).__name__}: {exc}")
    raise

finally:
    db.close()
