from pprint import pprint

from app.services.match_analysis_pipeline import (
    MatchAnalysisPipeline,
)

pipeline = MatchAnalysisPipeline()

result = pipeline.analyze_match(1)

pprint(result)
