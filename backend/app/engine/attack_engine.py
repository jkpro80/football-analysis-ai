from dataclasses import dataclass


@dataclass
class AttackStats:
    goals_per_match: float
    xg: float
    shots: float
    shots_on_target: float
    big_chances: float


class AttackEngine:
    """
    Calculates attacking strength (0-100).
    """

    def calculate(self, stats: AttackStats) -> dict:

        score = (
            stats.goals_per_match * 35
            + stats.xg * 20
            + stats.shots * 1.5
            + stats.shots_on_target * 4
            + stats.big_chances * 8
        )

        score = min(score, 100)

        return {
            "attack_score": round(score, 2),
            "goals_per_match": stats.goals_per_match,
            "xg": stats.xg,
            "shots": stats.shots,
            "shots_on_target": stats.shots_on_target,
            "big_chances": stats.big_chances,
        }