from typing import Any

from sqlalchemy.orm import Session

from app.database.models import Match, Team
from app.engine.poisson_engine import (
    run_poisson_model,
)
from app.engine.rating_engine import (
    calculate_expected_goals,
)
from app.services.head_to_head_service import (
    get_head_to_head,
)
from app.services.recent_form_service import (
    get_recent_team_form,
)


class PredictionEngineV3:
    """
    محرك التوقعات V3.

    يعتمد على:
    - بيانات الفريق المخزنة
    - آخر خمس مباريات
    - فورمة الأرض لصاحب الأرض
    - فورمة الخارج للفريق الضيف
    - المواجهات المباشرة
    - تصنيف Elo
    - Rating Engine
    - Poisson Engine
    """

    MODEL_VERSION = "Prediction Engine V3"

    def __init__(
        self,
        db: Session,
    ) -> None:
        self.db = db

    def get_team(
        self,
        team_id: int,
    ) -> Team:
        """
        جلب فريق من قاعدة البيانات.
        """

        team = self.db.get(
            Team,
            team_id,
        )

        if team is None:
            raise ValueError(
                f"Team with id {team_id} was not found."
            )

        return team

    def get_match(
        self,
        match_id: int,
    ) -> Match:
        """
        جلب مباراة من قاعدة البيانات.
        """

        print("\n" + "=" * 70)
        print("PredictionEngineV3.get_match()")
        print(f"Requested Match ID : {match_id}")
        print(f"Database Session   : {self.db}")

        match = self.db.get(
            Match,
            match_id,
        )

        print(f"Database Result    : {match}")

        if match is not None:
            try:
                print(
                    f"Match -> id={match.id}, "
                    f"sportmonks_id={match.sportmonks_id}, "
                    f"home={match.home_team_id}, "
                    f"away={match.away_team_id}, "
                    f"date={match.date}"
                )
            except Exception as exc:
                print("Error while printing match:", exc)

        print("=" * 70 + "\n")

        if match is None:
            raise ValueError(
                f"Match with id {match_id} was not found."
            )

        return match

    @staticmethod
    def team_to_dict(
        team: Team,
    ) -> dict[str, Any]:
        """
        تحويل نموذج Team إلى قاموس
        مناسب لمحرك Rating Engine.
        """

        return {
            "id": team.id,
            "name": team.name,
            "country": team.country,
            "attack": team.attack,
            "defense": team.defense,
            "midfield": team.midfield,
            "elo": team.elo,
            "home_advantage": (
                team.home_advantage
            ),
            "goals_scored": (
                team.goals_scored
            ),
            "goals_conceded": (
                team.goals_conceded
            ),
            "form": team.form,
            "wins": team.wins,
            "draws": team.draws,
            "losses": team.losses,
            "possession": team.possession,
            "shots": team.shots,
            "shots_on_target": (
                team.shots_on_target
            ),
            "corners": team.corners,
            "yellow_cards": (
                team.yellow_cards
            ),
            "red_cards": team.red_cards,
            "clean_sheets": (
                team.clean_sheets
            ),
            "failed_to_score": (
                team.failed_to_score
            ),
            "xg": team.xg,
            "xga": team.xga,
        }

    @staticmethod
    def apply_recent_form(
        team_data: dict[str, Any],
        recent_form: dict[str, Any],
    ) -> dict[str, Any]:
        """
        دمج آخر نتائج الفريق مع بياناته.
        """

        if (
            recent_form.get(
                "matches_played",
                0,
            )
            == 0
        ):
            return team_data

        updated_team = dict(team_data)

        updated_team["form"] = (
            recent_form.get(
                "form",
                updated_team.get(
                    "form",
                    "",
                ),
            )
        )

        updated_team["goals_scored"] = (
            recent_form.get(
                "average_goals_scored",
                updated_team.get(
                    "goals_scored",
                    1.5,
                ),
            )
        )

        updated_team["goals_conceded"] = (
            recent_form.get(
                "average_goals_conceded",
                updated_team.get(
                    "goals_conceded",
                    1.0,
                ),
            )
        )

        updated_team["clean_sheets"] = (
            recent_form.get(
                "clean_sheet_percentage",
                updated_team.get(
                    "clean_sheets",
                    0,
                ),
            )
        )

        updated_team["failed_to_score"] = (
            recent_form.get(
                "failed_to_score_percentage",
                updated_team.get(
                    "failed_to_score",
                    0,
                ),
            )
        )

        return updated_team

    @staticmethod
    def apply_venue_form(
        team_data: dict[str, Any],
        venue_form: dict[str, Any],
    ) -> dict[str, Any]:
        """
        دمج فورمة الأرض أو الخارج
        مع الفورمة العامة للفريق.
        """

        if (
            venue_form.get(
                "matches_played",
                0,
            )
            == 0
        ):
            return team_data

        updated_team = dict(team_data)

        updated_team["form"] = (
            venue_form.get(
                "form",
                updated_team.get(
                    "form",
                    "",
                ),
            )
        )

        updated_team["goals_scored"] = round(
            (
                float(
                    updated_team.get(
                        "goals_scored",
                        1.5,
                    )
                )
                + float(
                    venue_form.get(
                        "average_goals_scored",
                        1.5,
                    )
                )
            )
            / 2,
            2,
        )

        updated_team["goals_conceded"] = round(
            (
                float(
                    updated_team.get(
                        "goals_conceded",
                        1.0,
                    )
                )
                + float(
                    venue_form.get(
                        "average_goals_conceded",
                        1.0,
                    )
                )
            )
            / 2,
            2,
        )

        updated_team["clean_sheets"] = round(
            (
                float(
                    updated_team.get(
                        "clean_sheets",
                        0,
                    )
                )
                + float(
                    venue_form.get(
                        "clean_sheet_percentage",
                        0,
                    )
                )
            )
            / 2,
            2,
        )

        updated_team["failed_to_score"] = round(
            (
                float(
                    updated_team.get(
                        "failed_to_score",
                        0,
                    )
                )
                + float(
                    venue_form.get(
                        "failed_to_score_percentage",
                        0,
                    )
                )
            )
            / 2,
            2,
        )

        return updated_team

    @staticmethod
    def apply_head_to_head(
        home_data: dict[str, Any],
        away_data: dict[str, Any],
        head_to_head: dict[str, Any],
    ) -> tuple[
        dict[str, Any],
        dict[str, Any],
    ]:
        """
        تطبيق تأثير محدود للمواجهات المباشرة.

        لا يتم تطبيق التأثير إلا عند توفر
        ثلاث مواجهات سابقة على الأقل.
        """

        updated_home = dict(home_data)
        updated_away = dict(away_data)

        matches_played = int(
            head_to_head.get(
                "matches_played",
                0,
            )
        )

        if matches_played < 3:
            return (
                updated_home,
                updated_away,
            )

        home_win_percentage = float(
            head_to_head.get(
                "home_win_percentage",
                0,
            )
        )

        away_win_percentage = float(
            head_to_head.get(
                "away_win_percentage",
                0,
            )
        )

        advantage_difference = (
            home_win_percentage
            - away_win_percentage
        )

        adjustment = min(
            abs(advantage_difference)
            / 100
            * 0.10,
            0.08,
        )

        home_attack = float(
            updated_home.get(
                "attack",
                80,
            )
        )

        away_attack = float(
            updated_away.get(
                "attack",
                80,
            )
        )

        if advantage_difference > 0:
            updated_home["attack"] = round(
                home_attack
                * (1 + adjustment),
                2,
            )

            updated_away["attack"] = round(
                away_attack
                * (1 - adjustment),
                2,
            )

        elif advantage_difference < 0:
            updated_away["attack"] = round(
                away_attack
                * (1 + adjustment),
                2,
            )

            updated_home["attack"] = round(
                home_attack
                * (1 - adjustment),
                2,
            )

        return (
            updated_home,
            updated_away,
        )

    @staticmethod
    def get_confidence(
        result_probabilities: dict[str, float],
    ) -> dict[str, Any]:
        """
        حساب مستوى الثقة اعتمادًا
        على أعلى احتمال لنتيجة المباراة.
        """

        highest_probability = max(
            result_probabilities.values()
        )

        if highest_probability >= 65:
            confidence = "high"

        elif highest_probability >= 50:
            confidence = "medium"

        else:
            confidence = "low"

        confidence_score = round(
            min(
                100,
                highest_probability + 20,
            )
        )

        return {
            "confidence": confidence,
            "confidence_score": (
                confidence_score
            ),
        }

    @staticmethod
    def get_best_pick(
        poisson_result: dict[str, Any],
    ) -> dict[str, Any]:
        """
        اختيار أفضل سوق احتمالي.
        """

        probabilities = (
            poisson_result[
                "probabilities"
            ]
        )

        over_under = (
            poisson_result[
                "over_under"
            ]
        )

        btts = poisson_result["btts"]

        candidates = [
            {
                "key": "home_win",
                "label": "فوز صاحب الأرض",
                "probability": (
                    probabilities[
                        "home_win"
                    ]
                ),
            },
            {
                "key": "draw",
                "label": "التعادل",
                "probability": (
                    probabilities[
                        "draw"
                    ]
                ),
            },
            {
                "key": "away_win",
                "label": "فوز الفريق الضيف",
                "probability": (
                    probabilities[
                        "away_win"
                    ]
                ),
            },
            {
                "key": "over_1_5",
                "label": "أكثر من 1.5 هدف",
                "probability": (
                    over_under[
                        "over_1_5"
                    ]
                ),
            },
            {
                "key": "over_2_5",
                "label": "أكثر من 2.5 هدف",
                "probability": (
                    over_under[
                        "over_2_5"
                    ]
                ),
            },
            {
                "key": "under_3_5",
                "label": "أقل من 3.5 هدف",
                "probability": (
                    over_under[
                        "under_3_5"
                    ]
                ),
            },
            {
                "key": "btts_yes",
                "label": "يسجل الفريقان",
                "probability": (
                    btts["yes"]
                ),
            },
            {
                "key": "btts_no",
                "label": "لا يسجل الفريقان",
                "probability": (
                    btts["no"]
                ),
            },
        ]

        best_pick = max(
            candidates,
            key=lambda item: item[
                "probability"
            ],
        )

        probability = float(
            best_pick["probability"]
        )

        if probability >= 80:
            rating = 5

        elif probability >= 70:
            rating = 4

        elif probability >= 60:
            rating = 3

        elif probability >= 50:
            rating = 2

        else:
            rating = 1

        return {
            **best_pick,
            "rating": rating,
        }

    @staticmethod
    def build_analysis(
        home_team: Team,
        away_team: Team,
        rating_result: dict[str, Any],
        head_to_head: dict[str, Any] | None = None,
    ) -> list[str]:
        """
        بناء تحليل مختصر للتوقع.
        """

        factors = rating_result[
            "factors"
        ]

        analysis: list[str] = []

        if (
            factors["home_attack"]
            > factors["away_attack"] + 0.10
        ):
            analysis.append(
                f"{home_team.name} يمتلك "
                "مؤشرات هجومية أفضل."
            )

        elif (
            factors["away_attack"]
            > factors["home_attack"] + 0.10
        ):
            analysis.append(
                f"{away_team.name} يمتلك "
                "مؤشرات هجومية أفضل."
            )

        else:
            analysis.append(
                "القوة الهجومية متقاربة "
                "بين الفريقين."
            )

        if (
            factors["home_defense"]
            > factors["away_defense"] + 0.10
        ):
            analysis.append(
                f"{home_team.name} يمتلك "
                "دفاعًا أقوى."
            )

        elif (
            factors["away_defense"]
            > factors["home_defense"] + 0.10
        ):
            analysis.append(
                f"{away_team.name} يمتلك "
                "دفاعًا أقوى."
            )

        else:
            analysis.append(
                "القوة الدفاعية متقاربة "
                "بين الفريقين."
            )

        if (
            factors["home_form"]
            > factors["away_form"] + 0.05
        ):
            analysis.append(
                f"{home_team.name} يمتلك "
                "فورمة حديثة أفضل."
            )

        elif (
            factors["away_form"]
            > factors["home_form"] + 0.05
        ):
            analysis.append(
                f"{away_team.name} يمتلك "
                "فورمة حديثة أفضل."
            )

        if (
            factors["home_elo"]
            > factors["away_elo"] + 0.05
        ):
            analysis.append(
                f"{home_team.name} يتفوق "
                "في تصنيف Elo."
            )

        elif (
            factors["away_elo"]
            > factors["home_elo"] + 0.05
        ):
            analysis.append(
                f"{away_team.name} يتفوق "
                "في تصنيف Elo."
            )

        if (
            head_to_head is not None
            and head_to_head.get(
                "matches_played",
                0,
            )
            >= 3
        ):
            home_h2h = float(
                head_to_head.get(
                    "home_win_percentage",
                    0,
                )
            )

            away_h2h = float(
                head_to_head.get(
                    "away_win_percentage",
                    0,
                )
            )

            if home_h2h > away_h2h + 15:
                analysis.append(
                    f"{home_team.name} يتفوق "
                    "في المواجهات المباشرة."
                )

            elif away_h2h > home_h2h + 15:
                analysis.append(
                    f"{away_team.name} يتفوق "
                    "في المواجهات المباشرة."
                )

            else:
                analysis.append(
                    "المواجهات المباشرة "
                    "متقاربة بين الفريقين."
                )

        analysis.append(
            f"{home_team.name} يستفيد من "
            "أفضلية اللعب على أرضه."
        )

        return analysis

    def predict_teams(
        self,
        home_team_id: int,
        away_team_id: int,
    ) -> dict[str, Any]:
        """
        توقع مباشر باستخدام معرفي الفريقين.

        هذا الاستدعاء لا يستخدم تاريخ مباراة
        ولا بيانات المواجهات السابقة.
        """

        if home_team_id == away_team_id:
            raise ValueError(
                "Home and away teams "
                "must be different."
            )

        home_team = self.get_team(
            home_team_id
        )

        away_team = self.get_team(
            away_team_id
        )

        home_data = self.team_to_dict(
            home_team
        )

        away_data = self.team_to_dict(
            away_team
        )

        rating_result = (
            calculate_expected_goals(
                home_team=home_data,
                away_team=away_data,
            )
        )

        poisson_result = run_poisson_model(
            home_expected_goals=(
                rating_result[
                    "home_expected_goals"
                ]
            ),
            away_expected_goals=(
                rating_result[
                    "away_expected_goals"
                ]
            ),
        )

        confidence_data = (
            self.get_confidence(
                poisson_result[
                    "probabilities"
                ]
            )
        )

        best_pick = self.get_best_pick(
            poisson_result
        )

        analysis = self.build_analysis(
            home_team=home_team,
            away_team=away_team,
            rating_result=rating_result,
        )

        return {
            "home_team": home_team.name,
            "away_team": away_team.name,
            **poisson_result,
            **confidence_data,
            "analysis": analysis,
            "best_pick": best_pick,
            "rating_factors": (
                rating_result[
                    "factors"
                ]
            ),
            "model": self.MODEL_VERSION,
        }

    def predict_match(
        self,
        match_id: int,
    ) -> dict[str, Any]:
        """
        توقع مباراة باستخدام البيانات
        السابقة لتاريخ المباراة فقط.
        """

        match = self.get_match(
            match_id
        )

        home_team = self.get_team(
            match.home_team_id
        )

        away_team = self.get_team(
            match.away_team_id
        )

        home_data = self.team_to_dict(
            home_team
        )

        away_data = self.team_to_dict(
            away_team
        )

        home_recent_form = (
            get_recent_team_form(
                db=self.db,
                team_id=(
                    match.home_team_id
                ),
                limit=5,
                before_date=match.date,
                exclude_match_id=(
                    match.id
                ),
            )
        )

        away_recent_form = (
            get_recent_team_form(
                db=self.db,
                team_id=(
                    match.away_team_id
                ),
                limit=5,
                before_date=match.date,
                exclude_match_id=(
                    match.id
                ),
            )
        )

        home_venue_form = (
            get_recent_team_form(
                db=self.db,
                team_id=(
                    match.home_team_id
                ),
                limit=5,
                before_date=match.date,
                exclude_match_id=(
                    match.id
                ),
                venue="home",
            )
        )

        away_venue_form = (
            get_recent_team_form(
                db=self.db,
                team_id=(
                    match.away_team_id
                ),
                limit=5,
                before_date=match.date,
                exclude_match_id=(
                    match.id
                ),
                venue="away",
            )
        )

        head_to_head = get_head_to_head(
            db=self.db,
            home_team_id=(
                match.home_team_id
            ),
            away_team_id=(
                match.away_team_id
            ),
            limit=5,
            before_date=match.date,
            exclude_match_id=match.id,
        )

        home_data = self.apply_recent_form(
            home_data,
            home_recent_form,
        )

        away_data = self.apply_recent_form(
            away_data,
            away_recent_form,
        )

        home_data = self.apply_venue_form(
            home_data,
            home_venue_form,
        )

        away_data = self.apply_venue_form(
            away_data,
            away_venue_form,
        )

        home_data, away_data = (
            self.apply_head_to_head(
                home_data=home_data,
                away_data=away_data,
                head_to_head=head_to_head,
            )
        )

        rating_result = (
            calculate_expected_goals(
                home_team=home_data,
                away_team=away_data,
            )
        )

        poisson_result = run_poisson_model(
            home_expected_goals=(
                rating_result[
                    "home_expected_goals"
                ]
            ),
            away_expected_goals=(
                rating_result[
                    "away_expected_goals"
                ]
            ),
        )

        confidence_data = (
            self.get_confidence(
                poisson_result[
                    "probabilities"
                ]
            )
        )

        best_pick = self.get_best_pick(
            poisson_result
        )

        analysis = self.build_analysis(
            home_team=home_team,
            away_team=away_team,
            rating_result=rating_result,
            head_to_head=head_to_head,
        )

        return {
            "match_id": match.id,
            "sportmonks_id": (
                match.sportmonks_id
            ),
            "date": match.date,
            "status": match.status,
            "recent_form": {
                "home": (
                    home_recent_form
                ),
                "away": (
                    away_recent_form
                ),
                "home_venue": (
                    home_venue_form
                ),
                "away_venue": (
                    away_venue_form
                ),
            },
            "head_to_head": head_to_head,
            "home_team": home_team.name,
            "away_team": away_team.name,
            **poisson_result,
            **confidence_data,
            "analysis": analysis,
            "best_pick": best_pick,
            "rating_factors": (
                rating_result[
                    "factors"
                ]
            ),
            "model": self.MODEL_VERSION,
        }