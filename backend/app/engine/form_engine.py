from dataclasses import dataclass


@dataclass
class MatchResult:
    goals_for: int
    goals_against: int


class FormEngine:
    """
    Calculates recent form score from the last matches.
    """

    WIN_POINTS = 3
    DRAW_POINTS = 1
    LOSS_POINTS = 0

    def calculate(self, matches: list[MatchResult]) -> dict:

        if not matches:
            return {
                "form_score": 50.0,
                "points": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "avg_goals_for": 0,
                "avg_goals_against": 0,
            }

        wins = 0
        draws = 0
        losses = 0

        goals_for = 0
        goals_against = 0

        points = 0

        for match in matches:

            goals_for += match.goals_for
            goals_against += match.goals_against

            if match.goals_for > match.goals_against:
                wins += 1
                points += self.WIN_POINTS

            elif match.goals_for == match.goals_against:
                draws += 1
                points += self.DRAW_POINTS

            else:
                losses += 1

        max_points = len(matches) * 3

        form_score = (points / max_points) * 100

        return {
            "form_score": round(form_score, 2),
            "points": points,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "avg_goals_for": round(goals_for / len(matches), 2),
            "avg_goals_against": round(goals_against / len(matches), 2),
        }