import json
from pathlib import Path

from app.services.match_analysis_pipeline import MatchAnalysisPipeline

MATCH_ID = 27

with MatchAnalysisPipeline() as pipeline:
    result = pipeline.analyze_match(match_id=MATCH_ID)

Path("pipeline-result.json").write_text(
    json.dumps(
        result,
        ensure_ascii=False,
        indent=2,
        default=str,
    ),
    encoding="utf-8",
)

print("Done")