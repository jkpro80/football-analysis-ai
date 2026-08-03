from dataclasses import dataclass


@dataclass
class DefenseStats:
    goals_against_per_match: float
    xga: float
    clean_sheet_rate: float
    blocks_per_match: float
    interceptions_per_match: float


class DefenseEngine:
    """
    Calculates defensive strength from 0 to 100.

    Higher score means better defensive performance.
    """

    def calculate(self, stats: DefenseStats) -> dict:
        goals_against_score = max(
            0.0,
            100.0 - (stats.goals_against_per_match * 35.0),
        )

        xga_score = max(
            0.0,
            100.0 - (stats.xga * 30.0),
        )

        clean_sheet_score = self._normalize_percentage(
            stats.clean_sheet_rate
        )

        blocks_score = min(
            max(stats.blocks_per_match, 0.0) / 5.0 * 100.0,
            100.0,
        )

        interceptions_score = min(
            max(stats.interceptions_per_match, 0.0) / 12.0 * 100.0,
            100.0,
        )

        defense_score = (
            goals_against_score * 0.35
            + xga_score * 0.30
            + clean_sheet_score * 0.20
            + blocks_score * 0.075
            + interceptions_score * 0.075
        )

        defense_score = min(max(defense_score, 0.0), 100.0)

        return {
            "defense_score": round(defense_score, 2),
            "goals_against_per_match": stats.goals_against_per_match,
            "xga": stats.xga,
            "clean_sheet_rate": stats.clean_sheet_rate,
            "blocks_per_match": stats.blocks_per_match,
            "interceptions_per_match": stats.interceptions_per_match,
        }

    @staticmethod
    def _normalize_percentage(value: float) -> float:
        """
        Accepts either:
        - decimal format: 0.40
        - percentage format: 40
        """

        if value <= 1:
            value *= 100

        return min(max(value, 0.0), 100.0)