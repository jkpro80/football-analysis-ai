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

    score_matrix: Optional[Any] = None
    features: Optional[Dict[str, Any]] = None
    raw_data: Optional[Dict[str, Any]] = None

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