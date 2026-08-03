from math import exp, factorial
from typing import Any


MAX_GOALS = 8


def poisson_probability(
    expected_goals: float,
    goals: int,
) -> float:
    if expected_goals < 0:
        raise ValueError(
            "expected_goals cannot be negative."
        )

    if goals < 0:
        return 0.0

    return (
        exp(-expected_goals)
        * expected_goals**goals
        / factorial(goals)
    )


def build_score_matrix(
    home_expected_goals: float,
    away_expected_goals: float,
    max_goals: int = MAX_GOALS,
) -> list[list[float]]:
    if max_goals < 1:
        raise ValueError(
            "max_goals must be at least 1."
        )

    matrix: list[list[float]] = []

    for home_goals in range(max_goals + 1):
        row: list[float] = []

        home_probability = poisson_probability(
            home_expected_goals,
            home_goals,
        )

        for away_goals in range(max_goals + 1):
            away_probability = poisson_probability(
                away_expected_goals,
                away_goals,
            )

            row.append(
                home_probability
                * away_probability
            )

        matrix.append(row)

    return matrix


def normalize_probabilities(
    values: dict[str, float],
) -> dict[str, float]:
    total = sum(values.values())

    if total <= 0:
        return {
            key: 0.0
            for key in values
        }

    return {
        key: round(
            value / total * 100,
            2,
        )
        for key, value in values.items()
    }


def calculate_result_probabilities(
    score_matrix: list[list[float]],
) -> dict[str, float]:
    home_win = 0.0
    draw = 0.0
    away_win = 0.0

    for home_goals, row in enumerate(
        score_matrix
    ):
        for away_goals, probability in enumerate(
            row
        ):
            if home_goals > away_goals:
                home_win += probability
            elif home_goals == away_goals:
                draw += probability
            else:
                away_win += probability

    return normalize_probabilities(
        {
            "home_win": home_win,
            "draw": draw,
            "away_win": away_win,
        }
    )


def calculate_over_under(
    score_matrix: list[list[float]],
) -> dict[str, float]:
    thresholds = {
        "0_5": 0.5,
        "1_5": 1.5,
        "2_5": 2.5,
        "3_5": 3.5,
        "4_5": 4.5,
    }

    result: dict[str, float] = {}

    for key, threshold in thresholds.items():
        over_probability = 0.0
        under_probability = 0.0

        for home_goals, row in enumerate(
            score_matrix
        ):
            for away_goals, probability in enumerate(
                row
            ):
                total_goals = home_goals + away_goals

                if total_goals > threshold:
                    over_probability += probability
                else:
                    under_probability += probability

        normalized = normalize_probabilities(
            {
                "over": over_probability,
                "under": under_probability,
            }
        )

        result[f"over_{key}"] = normalized["over"]
        result[f"under_{key}"] = normalized["under"]

    return result


def calculate_btts(
    score_matrix: list[list[float]],
) -> dict[str, float]:
    yes_probability = 0.0
    no_probability = 0.0

    for home_goals, row in enumerate(
        score_matrix
    ):
        for away_goals, probability in enumerate(
            row
        ):
            if home_goals > 0 and away_goals > 0:
                yes_probability += probability
            else:
                no_probability += probability

    normalized = normalize_probabilities(
        {
            "yes": yes_probability,
            "no": no_probability,
        }
    )

    return {
        "yes": normalized["yes"],
        "no": normalized["no"],
    }


def calculate_clean_sheets(
    score_matrix: list[list[float]],
) -> dict[str, float]:
    home_clean_sheet = 0.0
    away_clean_sheet = 0.0

    for home_goals, row in enumerate(
        score_matrix
    ):
        for away_goals, probability in enumerate(
            row
        ):
            if away_goals == 0:
                home_clean_sheet += probability

            if home_goals == 0:
                away_clean_sheet += probability

    return {
        "home": round(
            home_clean_sheet * 100,
            2,
        ),
        "away": round(
            away_clean_sheet * 100,
            2,
        ),
    }


def calculate_double_chance(
    result_probabilities: dict[str, float],
) -> dict[str, float]:
    home_win = result_probabilities["home_win"]
    draw = result_probabilities["draw"]
    away_win = result_probabilities["away_win"]

    return {
        "home_or_draw": round(
            home_win + draw,
            2,
        ),
        "away_or_draw": round(
            away_win + draw,
            2,
        ),
        "home_or_away": round(
            home_win + away_win,
            2,
        ),
    }


def get_likely_scores(
    score_matrix: list[list[float]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    score_probabilities: list[
        tuple[str, float]
    ] = []

    for home_goals, row in enumerate(
        score_matrix
    ):
        for away_goals, probability in enumerate(
            row
        ):
            score_probabilities.append(
                (
                    f"{home_goals}-{away_goals}",
                    probability,
                )
            )

    score_probabilities.sort(
        key=lambda item: item[1],
        reverse=True,
    )

    return [
        {
            "score": score,
            "probability": round(
                probability * 100,
                2,
            ),
        }
        for score, probability
        in score_probabilities[:limit]
    ]


def run_poisson_model(
    home_expected_goals: float,
    away_expected_goals: float,
    max_goals: int = MAX_GOALS,
) -> dict[str, Any]:
    score_matrix = build_score_matrix(
        home_expected_goals=home_expected_goals,
        away_expected_goals=away_expected_goals,
        max_goals=max_goals,
    )

    result_probabilities = (
        calculate_result_probabilities(
            score_matrix
        )
    )

    over_under = calculate_over_under(
        score_matrix
    )

    btts = calculate_btts(
        score_matrix
    )

    clean_sheets = calculate_clean_sheets(
        score_matrix
    )

    double_chance = calculate_double_chance(
        result_probabilities
    )

    likely_scores = get_likely_scores(
        score_matrix,
        limit=5,
    )

    return {
        "expected_goals": {
            "home": round(
                home_expected_goals,
                2,
            ),
            "away": round(
                away_expected_goals,
                2,
            ),
            "total": round(
                home_expected_goals
                + away_expected_goals,
                2,
            ),
        },
        "probabilities": result_probabilities,
        "over_under": over_under,
        "btts": btts,
        "clean_sheets": clean_sheets,
        "double_chance": double_chance,
        "likely_scores": likely_scores,
    }