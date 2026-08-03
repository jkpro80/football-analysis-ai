from typing import Any


class PredictionMapperV11:
    @staticmethod
    def to_latest(data: dict[str, Any]) -> dict[str, Any]:
        return {
            "match": {
                "id": data["match"]["id"],
                "home_team": data["match"]["home_team"]["name"],
                "away_team": data["match"]["away_team"]["name"],
                "date": str(data["match"]["date"]),
                "status": "scheduled",
            },

            "prediction": {
                **data["prediction"],
                "expected_goals": data["expected_goals"],
                "most_likely_score": data["most_likely_score"],
                "confidence": data["confidence"],
            },

            "markets": {
                "match_result": {
                    "home_win": data["prediction"]["home_win"],
                    "draw": data["prediction"]["draw"],
                    "away_win": data["prediction"]["away_win"],
                },
                "totals": data["totals"],
                "btts": data["btts"],
                "double_chance": data["double_chance"],
                "draw_no_bet": data["draw_no_bet"],
                "clean_sheet": data["clean_sheet"],
                "win_to_nil": data["win_to_nil"],
            },

            "analysis": {
                "top_scores": data["top_scores"],
            },

            "features": data["features"],

            "meta": {
                "engine_version": data["model"],
                "service": data["service"],
            },
        }