export type Team = {
  id: number;
  name: string;
  country: string | null;
  logo?: string | null;
  logo_url?: string | null;
};

export type ScorePrediction = {
  score: string;
  home_goals: number;
  away_goals: number;
  probability: number;
};

export type MarketProbability = {
  over: number;
  under: number;
};

/**
 * نوع التوقع الواحد القادم من:
 * GET /predictions-v5/upcoming
 */
export type Prediction = {
  prediction_record_id: number;

  fixture: {
    id: number;
    sportmonks_id: number | null;
    date: string;
    status: string | null;
  };

  teams: {
    home: Team;
    away: Team;
  };

  expected_goals: {
    home: number;
    away: number;
    total: number;
  };

  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
    over_2_5: number;
    under_2_5: number;
    btts: number;
    no_btts: number;
  };

  predicted_score: string | null;

  best_pick: {
    key: string | null;
    label: string | null;
    probability: number | null;
  };

  confidence: {
    label: string;
    score: number | null;
  };

  model_version: string;
  created_at: string;
};

/**
 * الاستجابة الكاملة لمسار:
 * GET /predictions-v5/upcoming
 */
export type UpcomingResponse = {
  status: string;
  model_version: string;

  configuration: {
    limit: number;
    include_low_confidence: boolean;
  };

  count: number;
  predictions: Prediction[];
};

/**
 * استجابة تحليل المباراة المفردة.
 * أبقيناها لأنها قد تكون مستخدمة في صفحة تفاصيل المباراة.
 */
export type PredictionResponse = {
  success: boolean;

  engine: {
    name: string;
    version: string;
    generated_at: string;
  };

  match: {
    id: number;
    date: string;
    competition: string | null;
    venue: string | null;
    home_team: Team;
    away_team: Team;
  };

  expected_goals: {
    home: number;
    away: number;
    total: number;
  };

  prediction: {
    predicted_outcome: string;
    predicted_outcome_label: string;
    home_win: number;
    draw: number;
    away_win: number;
  };

  most_likely_score: ScorePrediction;
  top_scores: ScorePrediction[];

  btts: {
    yes: number;
    no: number;
  };

  totals: Record<string, MarketProbability>;

  double_chance: {
    home_or_draw_1x: number;
    home_or_away_12: number;
    draw_or_away_x2: number;
  };

  draw_no_bet: {
    home: number;
    away: number;
  };

  clean_sheet: {
    home: number;
    away: number;
    both_0_0: number;
  };

  win_to_nil: {
    home: number;
    away: number;
  };

  confidence: {
    confidence: number;
    level: string;
    predicted_outcome: string;
    predicted_outcome_label: string;
    highest_probability: number;
    probability_margin: number;
    model: string;

    factors: {
      probability_strength: number;
      probability_margin: number;
      elo_signal: number;
      attack_signal: number;
      defense_signal: number;
      form_signal: number;
      data_quality: number;
      xg_consistency: number;
      market_clarity: number;
    };

    warnings: string[];
  };
};