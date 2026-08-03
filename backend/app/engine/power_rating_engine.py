from dataclasses import dataclass


@dataclass
class TeamPowerComponents:
    form: float
    attack: float
    defense: float
    home_advantage: float
    elo: float


class PowerRatingEngine:
    """
    حساب التقييم العام لقوة الفريق اعتمادًا على عدة عناصر.
    """

    WEIGHTS = {
        "form": 0.30,
        "attack": 0.25,
        "defense": 0.20,
        "home_advantage": 0.15,
        "elo": 0.10,
    }

    def _calculate_team(
        self,
        team: TeamPowerComponents,
    ) -> float:
        """
        حساب تقييم فريق واحد.
        """

        return (
            team.form * self.WEIGHTS["form"]
            + team.attack * self.WEIGHTS["attack"]
            + team.defense * self.WEIGHTS["defense"]
            + team.home_advantage
            * self.WEIGHTS["home_advantage"]
            + team.elo * self.WEIGHTS["elo"]
        )

    def calculate(
        self,
        home: TeamPowerComponents,
        away: TeamPowerComponents,
    ) -> dict[str, float | str]:
        """
        حساب تقييم الفريقين وتحديد الفريق المفضل.
        """

        home_rating = self._calculate_team(home)
        away_rating = self._calculate_team(away)

        difference = home_rating - away_rating

        if difference > 3:
            favorite = "home"

        elif difference < -3:
            favorite = "away"

        else:
            favorite = "draw"

        return {
            "home_rating": round(home_rating, 2),
            "away_rating": round(away_rating, 2),
            "difference": round(difference, 2),
            "favorite": favorite,
        }