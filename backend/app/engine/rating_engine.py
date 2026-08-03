from typing import Any


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """
    حصر القيمة بين حد أدنى وحد أعلى.
    """

    return max(
        minimum,
        min(value, maximum),
    )


def normalize_rating(
    value: float,
    base: float = 80.0,
) -> float:
    """
    تحويل تقييم الفريق إلى معامل نسبي.

    مثال:
    80 => 1.00
    88 => 1.10
    72 => 0.90
    """

    if base <= 0:
        raise ValueError(
            "base must be greater than zero."
        )

    return value / base


def calculate_form_factor(
    form: str | None,
) -> float:
    """
    تحويل آخر النتائج إلى معامل فورمة.

    W = 3 نقاط
    D = 1 نقطة
    L = 0 نقاط
    """

    if not form:
        return 1.0

    valid_results = [
        result
        for result in form.upper()
        if result in {"W", "D", "L"}
    ]

    if not valid_results:
        return 1.0

    points = 0

    for result in valid_results:
        if result == "W":
            points += 3

        elif result == "D":
            points += 1

    maximum_points = (
        len(valid_results) * 3
    )

    percentage = (
        points / maximum_points
    )

    factor = (
        0.85
        + percentage * 0.30
    )

    return round(
        clamp(
            factor,
            0.85,
            1.15,
        ),
        4,
    )


def calculate_elo_factor(
    home_elo: float,
    away_elo: float,
) -> tuple[float, float]:
    """
    تحويل فارق Elo إلى معامل لكل فريق.
    """

    difference = (
        home_elo - away_elo
    )

    adjustment = clamp(
        difference / 1000,
        -0.20,
        0.20,
    )

    home_factor = 1.0 + adjustment
    away_factor = 1.0 - adjustment

    return (
        round(home_factor, 4),
        round(away_factor, 4),
    )


def calculate_attack_factor(
    team: dict[str, Any],
) -> float:
    """
    حساب المعامل الهجومي للفريق.
    """

    attack = float(
        team.get("attack", 80)
    )

    goals_scored = float(
        team.get("goals_scored", 1.5)
    )

    possession = float(
        team.get("possession", 50)
    )

    corners = float(
        team.get("corners", 5)
    )

    shots_on_target = float(
        team.get("shots_on_target", 5)
    )

    rating_factor = normalize_rating(
        attack
    )

    goals_factor = clamp(
        goals_scored / 1.5,
        0.55,
        1.65,
    )

    possession_factor = clamp(
        1.0
        + (possession - 50) / 200,
        0.85,
        1.15,
    )

    corners_factor = clamp(
        corners / 5,
        0.70,
        1.35,
    )

    shots_factor = clamp(
        shots_on_target / 5,
        0.70,
        1.35,
    )

    factor = (
        rating_factor * 0.35
        + goals_factor * 0.30
        + possession_factor * 0.15
        + corners_factor * 0.10
        + shots_factor * 0.10
    )

    return round(
        clamp(
            factor,
            0.55,
            1.60,
        ),
        4,
    )


def calculate_defense_factor(
    team: dict[str, Any],
) -> float:
    """
    حساب قوة الدفاع.

    كلما ارتفعت القيمة كان الدفاع أقوى.
    """

    defense = float(
        team.get("defense", 80)
    )

    goals_conceded = float(
        team.get("goals_conceded", 1.0)
    )

    clean_sheets = float(
        team.get("clean_sheets", 30)
    )

    xga = float(
        team.get("xga", 1.0)
    )

    rating_factor = normalize_rating(
        defense
    )

    conceded_factor = clamp(
        1.0 / max(
            goals_conceded,
            0.35,
        ),
        0.55,
        1.60,
    )

    clean_sheet_factor = clamp(
        0.80
        + clean_sheets / 150,
        0.80,
        1.45,
    )

    xga_factor = clamp(
        1.0 / max(
            xga,
            0.40,
        ),
        0.60,
        1.50,
    )

    factor = (
        rating_factor * 0.40
        + conceded_factor * 0.30
        + clean_sheet_factor * 0.15
        + xga_factor * 0.15
    )

    return round(
        clamp(
            factor,
            0.60,
            1.55,
        ),
        4,
    )


def calculate_expected_goals(
    home_team: dict[str, Any],
    away_team: dict[str, Any],
) -> dict[str, Any]:
    """
    حساب الأهداف المتوقعة للفريقين
    اعتمادًا على الهجوم والدفاع وElo
    والفورمة وأفضلية الأرض.
    """

    league_average_goals = 1.35

    home_attack = (
        calculate_attack_factor(
            home_team
        )
    )

    away_attack = (
        calculate_attack_factor(
            away_team
        )
    )

    home_defense = (
        calculate_defense_factor(
            home_team
        )
    )

    away_defense = (
        calculate_defense_factor(
            away_team
        )
    )

    home_form = calculate_form_factor(
        home_team.get("form")
    )

    away_form = calculate_form_factor(
        away_team.get("form")
    )

    home_elo_factor, away_elo_factor = (
        calculate_elo_factor(
            float(
                home_team.get("elo", 1800)
            ),
            float(
                away_team.get("elo", 1800)
            ),
        )
    )

    home_advantage = float(
        home_team.get(
            "home_advantage",
            1.10,
        )
    )

    home_expected_goals = (
        league_average_goals
        * home_attack
        / max(away_defense, 0.60)
        * home_form
        * home_elo_factor
        * home_advantage
    )

    away_expected_goals = (
        league_average_goals
        * away_attack
        / max(home_defense, 0.60)
        * away_form
        * away_elo_factor
    )

    home_expected_goals = clamp(
        home_expected_goals,
        0.20,
        4.50,
    )

    away_expected_goals = clamp(
        away_expected_goals,
        0.20,
        4.50,
    )

    return {
        "home_expected_goals": round(
            home_expected_goals,
            3,
        ),
        "away_expected_goals": round(
            away_expected_goals,
            3,
        ),
        "factors": {
            "home_attack": home_attack,
            "away_attack": away_attack,
            "home_defense": home_defense,
            "away_defense": away_defense,
            "home_form": home_form,
            "away_form": away_form,
            "home_elo": home_elo_factor,
            "away_elo": away_elo_factor,
            "home_advantage": (
                home_advantage
            ),
        },
    }