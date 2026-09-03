from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class EngineInfo(BaseModel):
    name: str
    version: str
    generated_at: str


class TeamSummary(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    country: Optional[str] = None
    logo: Optional[str] = None


class MatchSummary(BaseModel):
    id: int
    date: Optional[Any] = None

    status: Optional[str] = None
    home_score: Optional[int] = Field(
        default=None,
        ge=0,
    )
    away_score: Optional[int] = Field(
        default=None,
        ge=0,
    )
    is_finished: bool = False
    actual_outcome: Optional[str] = None

    competition: Optional[str] = None
    venue: Optional[str] = None

    home_team: TeamSummary
    away_team: TeamSummary

class ExpectedGoalsResponse(BaseModel):
    home: float = Field(ge=0)
    away: float = Field(ge=0)
    total: float = Field(ge=0)


class MatchPredictionResponse(BaseModel):
    predicted_outcome: Optional[str] = None
    predicted_outcome_label: Optional[str] = None
    home_win: float = Field(ge=0, le=100)
    draw: float = Field(ge=0, le=100)
    away_win: float = Field(ge=0, le=100)


class ExactScoreResponse(BaseModel):
    score: Optional[str] = None
    home_goals: Optional[int] = Field(default=None, ge=0)
    away_goals: Optional[int] = Field(default=None, ge=0)
    probability: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
    )


class ConfidenceFactors(BaseModel):
    probability_strength: Optional[float] = None
    probability_margin: Optional[float] = None
    elo_signal: Optional[float] = None
    attack_signal: Optional[float] = None
    defense_signal: Optional[float] = None
    form_signal: Optional[float] = None
    data_quality: Optional[float] = None
    xg_consistency: Optional[float] = None
    market_clarity: Optional[float] = None

    model_config = ConfigDict(extra="allow")


class ConfidenceResponse(BaseModel):
    confidence: float = Field(ge=0, le=100)
    level: str
    predicted_outcome: str
    predicted_outcome_label: str
    highest_probability: float = Field(ge=0, le=100)
    probability_margin: float = Field(ge=0, le=100)
    model: str
    factors: ConfidenceFactors
    warnings: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class PredictionEvaluationResponse(BaseModel):
    available: bool = False
    reason: Optional[str] = None

    actual_score: Optional[Dict[str, Any]] = None
    predicted_score: Optional[Dict[str, Any]] = None

    actual_outcome: Optional[str] = None
    predicted_outcome: Optional[str] = None

    winner_correct: Optional[bool] = None
    exact_score_correct: Optional[bool] = None

    actual_corners: Optional[Dict[str, Any]] = None
    actual_yellow_cards: Optional[Dict[str, Any]] = None

    corners: Optional[Dict[str, Any]] = None
    yellow_cards: Optional[Dict[str, Any]] = None
    btts: Dict[str, Any] = Field(
        default_factory=dict
    )
    over_2_5: Dict[str, Any] = Field(
        default_factory=dict
    )

    correct_checks: int = Field(
        default=0,
        ge=0,
    )
    total_checks: int = Field(
        default=0,
        ge=0,
    )
    accuracy_percentage: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
    )



class MatchIntelligencePlayerResponse(BaseModel):
    player_id: int
    player_name: str
    player_image: Optional[str] = None
    position_id: Optional[int] = None
    position_name: Optional[str] = None
    jersey_number: Optional[int] = None
    formation_field: Optional[str] = None
    formation_position: Optional[int] = None
    is_predicted: bool = False


class MatchIntelligenceAbsenceResponse(BaseModel):
    player_id: int
    player_name: str
    player_image: Optional[str] = None
    position_id: Optional[int] = None
    position_name: Optional[str] = None
    absence_type_name: Optional[str] = None
    absence_type_code: Optional[str] = None
    absence_category: str = "unknown"


class MatchIntelligenceTeamResponse(BaseModel):
    team_id: int
    team_name: str
    formation: Optional[str] = None

    starter_count: int = Field(ge=0)
    substitute_count: int = Field(ge=0)
    predicted_count: int = Field(ge=0)

    lineup_complete: bool = False

    starter_positions: Dict[str, int] = Field(
        default_factory=dict
    )

    starters: List[
        MatchIntelligencePlayerResponse
    ] = Field(
        default_factory=list
    )

    substitutes: List[
        MatchIntelligencePlayerResponse
    ] = Field(
        default_factory=list
    )

    absences: List[
        MatchIntelligenceAbsenceResponse
    ] = Field(
        default_factory=list
    )

    absence_count: int = Field(ge=0)

    absence_categories: Dict[str, int] = Field(
        default_factory=dict
    )

    absence_positions: Dict[str, int] = Field(
        default_factory=dict
    )

    absence_penalty: float = Field(
        ge=0,
        le=1,
    )

    availability_factor: float = Field(
        ge=0,
        le=1,
    )


class MatchIntelligenceWeatherResponse(BaseModel):
    available: bool = False

    temperature: Optional[float] = None
    feels_like: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[int] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    clouds: Optional[float] = None
    description: Optional[str] = None

    is_rain: bool = False
    is_extreme_heat: bool = False
    is_extreme_cold: bool = False

    severity: float = Field(
        default=0.0,
        ge=0,
        le=1,
    )

    attack_factor: float = Field(
        default=1.0,
        ge=0,
        le=1,
    )

    fatigue_factor: float = Field(
        default=1.0,
        ge=0,
        le=1,
    )


class MatchIntelligenceFeaturesResponse(BaseModel):
    home_availability_factor: float = Field(
        ge=0,
        le=1,
    )

    away_availability_factor: float = Field(
        ge=0,
        le=1,
    )

    home_absence_penalty: float = Field(
        ge=0,
        le=1,
    )

    away_absence_penalty: float = Field(
        ge=0,
        le=1,
    )

    weather_attack_factor: float = Field(
        ge=0,
        le=1,
    )

    weather_fatigue_factor: float = Field(
        ge=0,
        le=1,
    )

    weather_severity: float = Field(
        ge=0,
        le=1,
    )


class MatchIntelligenceResponse(BaseModel):
    fixture_id: int
    home: MatchIntelligenceTeamResponse
    away: MatchIntelligenceTeamResponse
    weather: MatchIntelligenceWeatherResponse
    features: MatchIntelligenceFeaturesResponse
    warnings: List[str] = Field(
        default_factory=list
    )

class PredictionAccessResponse(BaseModel):
    plan_code: str = "free"

    advanced_markets: bool = False
    match_intelligence: bool = False
    score_matrix: bool = False
    features: bool = False
    raw_data: bool = False

class PredictionResponse(BaseModel):
    """
    الاستجابة النهائية لمحرك Prediction Engine V11.

    بعض الأسواق مثل totals وteam_totals تختلف مفاتيحها بحسب
    إعدادات PoissonEngine، لذلك تُحفظ كقواميس مرنة.
    """

    success: bool = True
    engine: EngineInfo
    match: MatchSummary
    expected_goals: ExpectedGoalsResponse
    prediction: MatchPredictionResponse
    most_likely_score: ExactScoreResponse
    top_scores: List[ExactScoreResponse] = Field(default_factory=list)

    btts: Dict[str, Any] = Field(default_factory=dict)
    totals: Dict[str, Any] = Field(default_factory=dict)
    team_totals: Dict[str, Any] = Field(default_factory=dict)
    double_chance: Dict[str, Any] = Field(default_factory=dict)
    draw_no_bet: Dict[str, Any] = Field(default_factory=dict)
    clean_sheet: Dict[str, Any] = Field(default_factory=dict)
    win_to_nil: Dict[str, Any] = Field(default_factory=dict)

    confidence: ConfidenceResponse
    evaluation: Optional[
        PredictionEvaluationResponse
    ] = None

    score_matrix: Optional[Any] = None
    features: Optional[Dict[str, Any]] = None
    raw_data: Optional[Dict[str, Any]] = None

    match_intelligence: Optional[
        MatchIntelligenceResponse
    ] = None

    access: PredictionAccessResponse = Field(
        default_factory=PredictionAccessResponse
    )

    model_config = ConfigDict(
        extra="allow",
        from_attributes=True,
    )


class PredictionErrorDetails(BaseModel):
    type: str
    stage: str
    message: str


class PredictionErrorResponse(BaseModel):
    success: bool = False
    error: PredictionErrorDetails
