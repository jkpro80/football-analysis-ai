import json

from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import Match
from app.services.match_analysis_pipeline_v11 import MatchAnalysisPipelineV11


db = SessionLocal()

try:
    match = db.scalars(
        select(Match)
        .where(
            Match.status == "5",
            Match.home_score.is_not(None),
            Match.away_score.is_not(None),
        )
        .order_by(Match.date.desc(), Match.id.desc())
        .limit(1)
    ).first()

    if match is None:
        raise RuntimeError(
            "لا توجد مباراة منتهية صالحة لاختبار Prediction V11."
        )

    print(f"Testing match_id={match.id}")

    pipeline = MatchAnalysisPipelineV11(db=db)

    result = pipeline.analyze_match(
        match_id=int(match.id),
        history_limit=5,
        save_features=False,
        save_prediction=False,
    )

    with open(
        "prediction_v11_sample.json",
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

    print("Created prediction_v11_sample.json")

except Exception as exc:
    db.rollback()
    print(f"{type(exc).__name__}: {exc}")
    raise

finally:
    db.close()
