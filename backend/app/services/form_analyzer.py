class FormAnalyzer:

    @staticmethod
    def analyze(matches, team_id):
        empty_result = {
            "points": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_for": 0,
            "goals_against": 0,
            "average_goals_for": 0.0,
            "average_goals_against": 0.0,
        }

        if not matches:
            return empty_result

        wins = 0
        draws = 0
        losses = 0

        goals_for = 0
        goals_against = 0
        played = 0

        for match in matches:
            # تجاهل المباريات التي لم تُلعب أو لا تحتوي على نتيجة كاملة.
            if match.home_score is None or match.away_score is None:
                continue

            # تجاهل أي سجل لا يخص الفريق المطلوب.
            if match.home_team_id == team_id:
                gf = match.home_score
                ga = match.away_score
            elif match.away_team_id == team_id:
                gf = match.away_score
                ga = match.home_score
            else:
                continue

            goals_for += gf
            goals_against += ga
            played += 1

            if gf > ga:
                wins += 1
            elif gf == ga:
                draws += 1
            else:
                losses += 1

        if played == 0:
            return empty_result

        return {
            "points": wins * 3 + draws,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_for": goals_for,
            "goals_against": goals_against,
            "average_goals_for": round(goals_for / played, 2),
            "average_goals_against": round(goals_against / played, 2),
        }
