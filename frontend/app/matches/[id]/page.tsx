import type { ReactNode } from "react";
import type { Metadata } from "next";

import LatestMatchHero from "@/components/prediction/LatestMatchHero";
import MatchIntelligence, { type MatchIntelligenceData } from "@/components/prediction/MatchIntelligence";
import ConfidenceGauge from "@/components/prediction/ConfidenceGauge";
import ProScoreMatrix from "@/components/prediction/ProScoreMatrix";
import MatchDashboardOverview from "@/components/prediction/MatchDashboardOverview";
import MatchOdds, { type MatchOddsData } from "@/components/prediction/MatchOdds";
import { apiFetch } from "@/lib/api";
import { cookies } from "next/headers";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections, type Locale } from "@/lib/i18n/config";

import PredictionSummaryCard from "../../../components/prediction/PredictionSummaryCard";

type Score = {
  home_goals: number;
  away_goals: number;
  score: string;
  probability: number;
  outcome?: string;
};

type ScoreDistribution = {
  model?: string;
  normalized_entropy: number;
  score_margin: number;
  concentration: {
    top_1: number;
    top_3: number;
    top_5: number;
  };
  dominant_outcome: string;
  predicted_outcome?: string | null;
  outcome_consistency: {
    dominant_matches_prediction: boolean;
    top_score_matches_prediction: boolean;
    top_score_outcome: string;
  };
  most_likely_score: Score;
  recommended_score: Score;
  top_scores: Score[];
};

type Team = {
  id: number;
  name: string;
  country?: string;
  elo?: number;
  attack?: number;
  defense?: number;
  form?: string;
  form_rating?: number;
  goals_scored?: number;
  goals_conceded?: number;
  possession?: number;
  shots?: number;
  shots_on_target?: number;
  corners?: number;
  yellow_cards?: number;
  fouls?: number;
  points?: number;
  goal_difference?: number;
  statistics_rows_used?: number;
  logo?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
};

type TeamStatisticsResponse = {
  team_id: number;
  sportmonks_id?: number | null;
  team_name: string;
  country?: string | null;

  requested_matches: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  maximum_points: number;

  goals_scored: number;
  goals_conceded: number;
  goal_difference: number;

  average_goals_scored: number;
  average_goals_conceded: number;

  form: string[];
  form_string: string;
  form_rating: number;

  calculated_ratings: {
    attack: number;
    defense: number;
    midfield: number;
    elo: number;
  };

  match_averages: {
    possession: number | null;
    shots: number | null;
    shots_on_target: number | null;
    corners: number | null;
    fouls: number | null;
    yellow_cards: number | null;
    red_cards: number | null;
  };
};

type LeagueInfo = {
  name: string | null;
  logo: string | null;
};

type SeasonInfo = {
  name: string | null;
};

type VenueInfo = {
  name: string | null;
  city: string | null;
  capacity: number | null;
  image: string | null;
};

type RefereeInfo = {
  name: string | null;
};

type MatchEventExplanationTeam = {
  base_average: number;
  shots?: number;
  possession: number;
  fatigue_factor: number;
  factors: Record<string, number>;
};

type MatchEventExplanation = {
  method: string;
  distribution: string;
  home: MatchEventExplanationTeam;
  away: MatchEventExplanationTeam;
  weather_severity?: number;
  referee_adjusted?: boolean;
  formula: string;
};

type LatestPredictionResponse = {
  api_version: string;
  engine_version: string;
  odds_data: MatchOddsData | null;
  match: {
    id: number;
    home_team_id: number | null;
    away_team_id: number | null;
    home_team: string;
    away_team: string;
    home_logo: string | null;
    away_logo: string | null;
    home_country: string | null;
    away_country: string | null;
    date: string | null;
    status: string;

    home_score: number | null;
    away_score: number | null;
    is_finished: boolean;
    actual_outcome: string | null;
  };

  league?: LeagueInfo | null;
  season?: SeasonInfo | null;
  round?: string | null;
  stage?: string | null;
  venue?: VenueInfo | null;
  referee?: RefereeInfo | null;
  prediction: {
    predicted_outcome: string;
    predicted_outcome_label: string;
    most_likely_score: Score;
    recommended_score: Score;
    score_distribution: ScoreDistribution | null;
    expected_goals: {
      home_expected_goals: number;
      away_expected_goals: number;
      total_expected_goals: number;
    };
    confidence: {
      value: number;
      level: string;
      highest_probability: number;
      probability_margin: number;
    };
  };

  evaluation?: PredictionEvaluation;

  match_intelligence_available: boolean;
  match_intelligence: MatchIntelligenceData | null;

  match_events: {
    corners: {
      home_expected: number;
      away_expected: number;
      total_expected: number;
      over_probabilities: Record<string, number>;
      most_likely_range?: {
        minimum: number;
        maximum: number;
      };
      explanation?: MatchEventExplanation;
    } | null;

    yellow_cards: {
      home_expected: number;
      away_expected: number;
      total_expected: number;
      over_probabilities: Record<string, number>;
      most_likely_range?: {
        minimum: number;
        maximum: number;
      };
      referee_adjusted?: boolean;
      explanation?: MatchEventExplanation;
    } | null;

    data_quality: {
      corners_complete?: boolean;
      yellow_cards_complete?: boolean;
      uses_referee_profile?: boolean;
    };
  };

  markets: {
    advanced_available: boolean;
    match_result: {
      home_win: number;
      draw: number;
      away_win: number;
    };
    double_chance: {
      home_or_draw_1x: number;
      home_or_away_12: number;
      draw_or_away_x2: number;
    };
    draw_no_bet: {
      home: number;
      away: number;
    };
    btts: {
      yes: number;
      no: number;
    };
    totals: Record<string, { over: number; under: number }>;
    clean_sheet: {
      home: number;
      away: number;
      both_0_0: number;
    };
    win_to_nil: {
      home: number;
      away: number;
    };
    top_scores: Score[];
    score_matrix: Score[];
  };
  analysis: {
    confidence_model: string;
    confidence_factors: Record<string, number>;
    warnings: string[];
  };
  features: {
    home_team: Team;
    away_team: Team;
    differences?: Record<string, number>;

    home_possession?: number;
    away_possession?: number;

    home_shots?: number;
    away_shots?: number;

    home_shots_on_target?: number;
    away_shots_on_target?: number;

    home_corners?: number;
    away_corners?: number;

    home_yellow_cards?: number;
    away_yellow_cards?: number;

    home_fouls?: number;
    away_fouls?: number;
  };
  meta: {
    execution_time_ms?: number;
    total_execution_time_ms?: number;
    pipeline?: string[];
  };
};

type PageProps = {
  params: Promise<{ id: string }>;
};

type PredictionEvaluation = {
  available: boolean;
  reason?: string | null;

  actual_score?: {
    home?: number;
    away?: number;
    total?: number;
  } | null;

  predicted_score?: {
    home?: number | null;
    away?: number | null;
    score?: string | null;
  } | null;

  actual_outcome?: string | null;
  predicted_outcome?: string | null;

  winner_correct?: boolean | null;
  exact_score_correct?: boolean | null;

  actual_corners?: {
    available?: boolean;
    home?: number | null;
    away?: number | null;
    total?: number | null;
  } | null;

  actual_yellow_cards?: {
    available?: boolean;
    home?: number | null;
    away?: number | null;
    total?: number | null;
  } | null;

  btts?: {
    predicted?: boolean;
    actual?: boolean;
    correct?: boolean;
    yes_probability?: number;
    no_probability?: number;
  };

  over_2_5?: {
    predicted?: boolean;
    actual?: boolean;
    correct?: boolean;
    over_probability?: number;
    under_probability?: number;
  };

  corners?: {
    available?: boolean;
    actual_total?: number | null;
    expected_min?: number | null;
    expected_max?: number | null;
    correct?: boolean | null;
  };

  yellow_cards?: {
    available?: boolean;
    actual_total?: number | null;
    expected_min?: number | null;
    expected_max?: number | null;
    correct?: boolean | null;
  };

  correct_checks?: number;
  total_checks?: number;
  accuracy_percentage?: number | null;

  evaluation?: PredictionEvaluation;
};

type OfficialPredictionResponse = {
  success: boolean;

  engine: {
    name: string;
    version: string;
    generated_at: string;
  };

  match: {
    id: number;
    date?: string | null;

    status?: string | null;
    home_score?: number | null;
    away_score?: number | null;
    is_finished?: boolean;
    actual_outcome?: string | null;

    competition?: string | null;
    venue?: string | null;
    home_team?: {
      id?: number | null;
      name?: string | null;
      country?: string | null;
      logo?: string | null;
    };
    away_team?: {
      id?: number | null;
      name?: string | null;
      country?: string | null;
      logo?: string | null;
    };
  };

  expected_goals: {
    home: number;
    away: number;
    total: number;
  };

  prediction: {
    predicted_outcome?: string | null;
    predicted_outcome_label?: string | null;
    home_win: number;
    draw: number;
    away_win: number;
  };

  most_likely_score: Score;
  recommended_score?: Score | null;
  score_distribution?: ScoreDistribution | null;
  top_scores: Score[];
  score_matrix?: Score[] | null;

  access: {
    plan_code: string;
    advanced_markets: boolean;
    match_intelligence: boolean;
    score_matrix: boolean;
    features: boolean;
    raw_data: boolean;
  };

  match_intelligence?: MatchIntelligenceData | null;

  btts: {
    yes?: number;
    no?: number;
  };

  totals: Record<
    string,
    {
      over?: number;
      under?: number;
    }
  >;

  double_chance: {
    home_or_draw_1x?: number;
    home_or_away_12?: number;
    draw_or_away_x2?: number;
  };

  draw_no_bet: {
    home?: number;
    away?: number;
  };

  clean_sheet: {
    home?: number;
    away?: number;
    both_0_0?: number;
  };

  win_to_nil: {
    home?: number;
    away?: number;
  };

  confidence: {
    confidence: number;
    level: string;
    highest_probability: number;
    probability_margin: number;
    model: string;
    factors?: Record<string, number | null>;
    warnings?: string[];
  };

  evaluation?: PredictionEvaluation;

  match_events?: {
    corners?: {
      home_expected: number;
      away_expected: number;
      total_expected: number;
      over_probabilities: Record<string, number>;
      most_likely_range?: {
        minimum: number;
        maximum: number;
      };
      explanation?: MatchEventExplanation;
    };

    yellow_cards?: {
      home_expected: number;
      away_expected: number;
      total_expected: number;
      over_probabilities: Record<string, number>;
      most_likely_range?: {
        minimum: number;
        maximum: number;
      };
      referee_adjusted?: boolean;
      explanation?: MatchEventExplanation;
    };

    data_quality?: {
      corners_complete?: boolean;
      yellow_cards_complete?: boolean;
      uses_referee_profile?: boolean;
    };
  } | null;

  features?: {
    home_team?: Team;
    away_team?: Team;
    differences?: Record<string, number>;

    home_possession?: number;
    away_possession?: number;

    home_shots?: number;
    away_shots?: number;

    home_shots_on_target?: number;
    away_shots_on_target?: number;

    home_corners?: number;
    away_corners?: number;

    home_yellow_cards?: number;
    away_yellow_cards?: number;

    home_fouls?: number;
    away_fouls?: number;
  } | null;
};

type MatchDetailsResponse = {
  id: number;
  date?: string | null;
  status?: string | null;

  home_team_id?: number;
  away_team_id?: number;

  home_team?: string | null;
  away_team?: string | null;

  home_logo?: string | null;
  away_logo?: string | null;

  home_country?: string | null;
  away_country?: string | null;

  league_name?: string | null;
  league_logo?: string | null;
  season_name?: string | null;
  round_name?: string | null;
  stage_name?: string | null;

  venue_name?: string | null;
  venue_city?: string | null;
  venue_capacity?: number | null;
  venue_image?: string | null;

  referee_name?: string | null;
};

async function getPublicMatchForMetadata(
  matchId: number,
): Promise<MatchDetailsResponse | null> {
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return null;
  }

  try {
    return await apiFetch<MatchDetailsResponse>(
      `/matches/${matchId}`,
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const matchId = Number(id);

  if (!Number.isInteger(matchId) || matchId <= 0) {
    return {
      title: "Match Analysis",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalPath = `/matches/${matchId}`;
  const match = await getPublicMatchForMetadata(matchId);

  if (!match) {
    return {
      title: `Match ${matchId} Analysis`,
      alternates: {
        canonical: canonicalPath,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const homeTeam =
    match.home_team?.trim() || "Home Team";

  const awayTeam =
    match.away_team?.trim() || "Away Team";

  const league =
    match.league_name?.trim();

  const title =
    `${homeTeam} vs ${awayTeam} Prediction & Match Analysis`;

  const description = league
    ? `${homeTeam} vs ${awayTeam} ${league} match analysis, probabilities, statistics, fixture information and data-driven insights from MÅLX.`
    : `${homeTeam} vs ${awayTeam} football match analysis, probabilities, statistics, fixture information and data-driven insights from MÅLX.`;

  const socialImage =
    match.home_logo ||
    match.away_logo ||
    "/icon.svg";

  return {
    title,
    description,

    alternates: {
      canonical: canonicalPath,
    },

    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: "MÅLX",
      title: `${title} | MÅLX`,
      description,
      images: [
        {
          url: socialImage,
          alt: `${homeTeam} vs ${awayTeam}`,
        },
      ],
    },

    twitter: {
      card: "summary",
      title: `${title} | MÅLX`,
      description,
      images: [socialImage],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

function translateModelWarning(
  warning: string,
  locale: Locale,
): string {
  const translations: Record<
    string,
    { ar: string; en: string; sv: string }
  > = {
    "كمية البيانات المتاحة منخفضة، لذلك يجب التعامل مع التوقع بحذر.": {
      ar: "كمية البيانات المتاحة منخفضة، لذلك يجب التعامل مع التوقع بحذر.",
      en: "The available data is limited, so this prediction should be treated with caution.",
      sv: "Mängden tillgängliga data är begränsad, så prognosen bör tolkas med försiktighet.",
    },
    "فورمة الفريقين متقاربة جدًا.": {
      ar: "فورمة الفريقين متقاربة جدًا.",
      en: "The two teams are in very similar form.",
      sv: "Lagens aktuella form är mycket jämn.",
    },
    "تصنيف Elo متقارب بين الفريقين.": {
      ar: "تصنيف Elo متقارب بين الفريقين.",
      en: "The teams have very similar Elo ratings.",
      sv: "Lagets Elo-värden ligger mycket nära varandra.",
    },
  };

  const translation = translations[warning];

  if (!translation) {
    return warning;
  }

  if (locale === "sv") {
    return translation.sv;
  }

  if (locale === "en") {
    return translation.en;
  }

  return translation.ar;
}
function safeNumber(
  value: number | null | undefined,
): number {
  const resolved = Number(value);

  return Number.isFinite(resolved)
    ? resolved
    : 0;
}

async function getPrediction(
  matchId: number,
  accessToken: string,
  locale: Locale,
): Promise<LatestPredictionResponse> {
  const [match, prediction, oddsData] = await Promise.all([
    apiFetch<MatchDetailsResponse>(
      `/matches/${matchId}`,
    ),

    apiFetch<OfficialPredictionResponse>(
      `/predictions/${matchId}?include_features=true&include_score_matrix=true&include_raw_data=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ),

    apiFetch<MatchOddsData>(
      `/matches/${matchId}/odds/summary`,
    ).catch(() => null),
  ]);

  const predictionHome =
    prediction.match.home_team ?? {};

  const predictionAway =
    prediction.match.away_team ?? {};


  const mostLikelyScore: Score = {
    home_goals:
      safeNumber(
        prediction.most_likely_score?.home_goals,
      ),

    away_goals:
      safeNumber(
        prediction.most_likely_score?.away_goals,
      ),

    score:
      prediction.most_likely_score?.score ??
      "0-0",

    probability:
      safeNumber(
        prediction.most_likely_score?.probability,
      ),
  };

  const recommendedScore: Score = {
    home_goals: safeNumber(
      prediction.recommended_score?.home_goals ??
      mostLikelyScore.home_goals,
    ),

    away_goals: safeNumber(
      prediction.recommended_score?.away_goals ??
      mostLikelyScore.away_goals,
    ),

    score:
      prediction.recommended_score?.score ??
      mostLikelyScore.score,

    probability: safeNumber(
      prediction.recommended_score?.probability ??
      mostLikelyScore.probability,
    ),

    outcome:
      prediction.recommended_score?.outcome,
  };

  return {
    api_version: "API v1",
    odds_data: oddsData,

    engine_version:
      `${prediction.engine.name} ${prediction.engine.version}`,

    match: {
  id: match.id,
  home_team_id:
    match.home_team_id ?? null,
  away_team_id:
    match.away_team_id ?? null,
  home_logo:
    match.home_logo ?? null,
  away_logo:
    match.away_logo ?? null,
  home_country:
    match.home_country ?? null,
  away_country:
    match.away_country ?? null,

      home_team:
        match.home_team ??
        predictionHome.name ??
        (locale === "sv"
          ? "Hemmalaget"
          : locale === "en"
            ? "Home Team"
            : "الفريق المضيف"),

      away_team:
        match.away_team ??
        predictionAway.name ??
        (locale === "sv"
          ? "Bortalaget"
          : locale === "en"
            ? "Away Team"
            : "الفريق الضيف"),

      date:
        match.date ??
        prediction.match.date ??
        null,

      status:
        String(match.status ?? "scheduled"),

      home_score:
        prediction.match.home_score ?? null,

      away_score:
        prediction.match.away_score ?? null,

      is_finished:
        prediction.match.is_finished ?? false,

      actual_outcome:
        prediction.match.actual_outcome ?? null,
    },

    league: {
      name:
        match.league_name ??
        prediction.match.competition ??
        null,

      logo:
        match.league_logo ?? null,
    },

    season: {
      name:
        match.season_name ?? null,
    },

    round:
      match.round_name ?? null,

    stage:
      match.stage_name ?? null,

    venue: {
      name:
        match.venue_name ??
        prediction.match.venue ??
        null,

      city:
        match.venue_city ?? null,

      capacity:
        match.venue_capacity ?? null,

      image:
        match.venue_image ?? null,
    },

    referee: {
      name:
        match.referee_name ?? null,
    },

    prediction: {
      predicted_outcome:
        prediction.prediction.predicted_outcome ??
        "draw",

      predicted_outcome_label:
        prediction.prediction.predicted_outcome_label ??
        "Draw",

      most_likely_score:
        mostLikelyScore,

      recommended_score:
        recommendedScore,

      score_distribution:
        prediction.score_distribution ?? null,

      expected_goals: {
        home_expected_goals:
          safeNumber(
            prediction.expected_goals.home,
          ),

        away_expected_goals:
          safeNumber(
            prediction.expected_goals.away,
          ),

        total_expected_goals:
          safeNumber(
            prediction.expected_goals.total,
          ),
      },

      confidence: {
        value:
          safeNumber(
            prediction.confidence.confidence,
          ),

        level:
          prediction.confidence.level ??
          "Unknown",

        highest_probability:
          safeNumber(
            prediction.confidence.highest_probability,
          ),

        probability_margin:
          safeNumber(
            prediction.confidence.probability_margin,
          ),
      },
    },

    match_events: {
      corners:
        prediction.match_events?.corners ?? null,

      yellow_cards:
        prediction.match_events?.yellow_cards ?? null,

      data_quality:
        prediction.match_events?.data_quality ?? {},
    },

    evaluation:
      prediction.evaluation ?? undefined,

    match_intelligence_available:
      prediction.access.match_intelligence,

    match_intelligence:
      prediction.match_intelligence ?? null,

    markets: {
      advanced_available:
        prediction.access.advanced_markets,
      match_result: {
        home_win:
          safeNumber(
            prediction.prediction.home_win,
          ),

        draw:
          safeNumber(
            prediction.prediction.draw,
          ),

        away_win:
          safeNumber(
            prediction.prediction.away_win,
          ),
      },

      double_chance: {
        home_or_draw_1x:
          safeNumber(
            prediction.double_chance
              ?.home_or_draw_1x,
          ),

        home_or_away_12:
          safeNumber(
            prediction.double_chance
              ?.home_or_away_12,
          ),

        draw_or_away_x2:
          safeNumber(
            prediction.double_chance
              ?.draw_or_away_x2,
          ),
      },

      draw_no_bet: {
        home:
          safeNumber(
            prediction.draw_no_bet?.home,
          ),

        away:
          safeNumber(
            prediction.draw_no_bet?.away,
          ),
      },

      btts: {
        yes:
          safeNumber(
            prediction.btts?.yes,
          ),

        no:
          safeNumber(
            prediction.btts?.no,
          ),
      },

      totals: Object.fromEntries(
        Object.entries(
          prediction.totals ?? {},
        ).map(([key, value]) => [
          key,
          {
            over: safeNumber(value?.over),
            under: safeNumber(value?.under),
          },
        ]),
      ),

      clean_sheet: {
        home:
          safeNumber(
            prediction.clean_sheet?.home,
          ),

        away:
          safeNumber(
            prediction.clean_sheet?.away,
          ),

        both_0_0:
          safeNumber(
            prediction.clean_sheet?.both_0_0,
          ),
      },

      win_to_nil: {
        home:
          safeNumber(
            prediction.win_to_nil?.home,
          ),

        away:
          safeNumber(
            prediction.win_to_nil?.away,
          ),
      },

      top_scores:
        Array.isArray(prediction.top_scores)
          ? prediction.top_scores.map(
              (score) => ({
                home_goals:
                  safeNumber(score.home_goals),

                away_goals:
                  safeNumber(score.away_goals),

                score:
                  score.score ?? "0-0",

                probability:
                  safeNumber(score.probability),
              }),
            )
          : [],

      score_matrix:
        Array.isArray(prediction.score_matrix)
          ? prediction.score_matrix.map((score) => ({
              home_goals: safeNumber(score.home_goals),
              away_goals: safeNumber(score.away_goals),
              score: score.score ?? "0-0",
              probability: safeNumber(score.probability),
            }))
          : [],
    },

    analysis: {
      confidence_model:
        prediction.confidence.model ??
        "Confidence Engine",

      confidence_factors:
        Object.fromEntries(
          Object.entries(
            prediction.confidence.factors ?? {},
          ).map(([key, value]) => [
            key,
            safeNumber(value),
          ]),
        ),

      warnings:
        Array.isArray(
          prediction.confidence.warnings,
        )
          ? prediction.confidence.warnings
          : [],
    },

    features: {
      home_team: {
        id:
          match.home_team_id ??
          predictionHome.id ??
          0,
        name:
          match.home_team ??
          predictionHome.name ??
          (locale === "sv"
            ? "Hemmalaget"
            : locale === "en"
              ? "Home Team"
              : "الفريق المضيف"),
        country:
          match.home_country ??
          predictionHome.country ??
          undefined,
        logo:
          match.home_logo ??
          predictionHome.logo ??
          null,
      },
      away_team: {
        id:
          match.away_team_id ??
          predictionAway.id ??
          0,
        name:
          match.away_team ??
          predictionAway.name ??
          (locale === "sv"
            ? "Bortalaget"
            : locale === "en"
              ? "Away Team"
              : "الفريق الضيف"),
        country:
          match.away_country ??
          predictionAway.country ??
          undefined,
        logo:
          match.away_logo ??
          predictionAway.logo ??
          null,
      },
      differences: prediction.features?.differences ?? {},

      home_possession:
        prediction.features?.home_possession,
      away_possession:
        prediction.features?.away_possession,

      home_shots:
        prediction.features?.home_shots,
      away_shots:
        prediction.features?.away_shots,

      home_shots_on_target:
        prediction.features?.home_shots_on_target,
      away_shots_on_target:
        prediction.features?.away_shots_on_target,

      home_corners:
        prediction.features?.home_corners,
      away_corners:
        prediction.features?.away_corners,

      home_yellow_cards:
        prediction.features?.home_yellow_cards,
      away_yellow_cards:
        prediction.features?.away_yellow_cards,

      home_fouls:
        prediction.features?.home_fouls,
      away_fouls:
        prediction.features?.away_fouls,
    },

    meta: {
      pipeline: [
        "Match Details API",
        "Prediction Engine V11",
      ],
    },
  };
}

function pct(value: number, digits = 2) {
  return `${Number(value ?? 0).toFixed(digits)}%`;
}


function formatOutcome(
  outcome: string,
  home: string,
  away: string,
  locale: Locale,
) {
  if (locale === "sv") {
    if (outcome === "home_win") return `${home} vinner`;
    if (outcome === "away_win") return `${away} vinner`;
    return "Oavgjort";
  }

  if (locale === "en") {
    if (outcome === "home_win") return `${home} wins`;
    if (outcome === "away_win") return `${away} wins`;
    return "Draw";
  }

  if (outcome === "home_win") return `فوز ${home}`;
  if (outcome === "away_win") return `فوز ${away}`;
  return "التعادل";
}

function intlLocale(locale: Locale) {
  if (locale === "sv") return "sv-SE";
  if (locale === "en") return "en-US";
  return "ar-IQ";
}

function unavailableText(locale: Locale) {
  if (locale === "sv") return "Inte tillgänglig";
  if (locale === "en") return "Not available";
  return "غير متوفر";
}

function matchDateUnavailableText(locale: Locale) {
  if (locale === "sv") return "Matchtiden är inte tillgänglig";
  if (locale === "en") return "Match time is not available";
  return "موعد المباراة غير متوفر";
}

function formatDate(
  date: string | null,
  locale: Locale,
) {
  if (!date) return matchDateUnavailableText(locale);

  const parsed = new Date(
    date.includes("T") ? date : date.replace(" ", "T"),
  );

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

function formatCapacity(
  capacity: number | null | undefined,
  locale: Locale,
) {
  if (!capacity || capacity <= 0) {
    return unavailableText(locale);
  }

  return new Intl.NumberFormat(intlLocale(locale)).format(capacity);
}

type ConfidenceTone = {
  border: string;
  background: string;
  text: string;
  fill: string;
  badge: string;
  label: "high" | "medium" | "low";
};

function confidenceTone(value: number): ConfidenceTone {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);

  if (safeValue >= 60) {
    return {
      border: "border-emerald-400/35",
      background: "bg-emerald-400/[0.07]",
      text: "text-emerald-300",
      fill: "bg-emerald-400",
      badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
      label: "high",
    };
  }

  if (safeValue >= 40) {
    return {
      border: "border-amber-400/35",
      background: "bg-amber-400/[0.07]",
      text: "text-amber-300",
      fill: "bg-amber-400",
      badge: "border-amber-400/25 bg-amber-400/10 text-amber-300",
      label: "medium",
    };
  }

  return {
    border: "border-rose-400/35",
    background: "bg-rose-400/[0.07]",
    text: "text-rose-300",
    fill: "bg-rose-400",
    badge: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    label: "low",
  };
}

function fairOdds(probability: number) {
  const safeProbability = Number(probability) || 0;
  return safeProbability > 0
    ? (100 / safeProbability).toFixed(2)
    : "—";
}

function ProgressCard({
  title,
  value,
  active = false,
  activeLabel = "الأعلى",
}: {
  title: string;
  value: number;
  active?: boolean;
  activeLabel?: string;
}) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);
  const tone = confidenceTone(safeValue);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#061020]/72 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="min-h-[2.25rem] whitespace-normal text-[13px] font-bold leading-[1.15rem] text-slate-200">{title}</p>
          {active && <span className="mt-1 block text-[12px] font-black text-cyan-400">{activeLabel}</span>}
        </div>
        <strong dir="ltr" className={["shrink-0 text-base font-black tabular-nums", tone.text].join(" ")}>{pct(safeValue)}</strong>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-900">
        <div className={["h-full rounded-full", tone.fill].join(" ")} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#061020]/72 px-3 py-3">
      <p className="min-h-[2rem] whitespace-normal text-[13px] font-bold leading-4 text-slate-400">{title}</p>
      <p dir="ltr" className="mt-1 text-[1.65rem] font-black tabular-nums text-cyan-300">{value}</p>
      {note && <p className="mt-1 text-[12px] leading-4 text-slate-500">{note}</p>}
    </div>
  );
}

function MatchInfoCard({
  league,
  season,
  round,
  stage,
  venue,
  referee,
  locale,
}: {
  league?: LeagueInfo | null;
  season?: SeasonInfo | null;
  round?: string | null;
  stage?: string | null;
  venue?: VenueInfo | null;
  referee?: RefereeInfo | null;
  locale: Locale;
}) {
  const text = locale === "sv"
    ? { title: "Matchinformation", league: "Liga", season: "Säsong", round: "Omgång", stage: "Fas", venue: "Arena", city: "Stad", capacity: "Kapacitet", referee: "Domare", unavailable: "Inte tillgänglig", refereePending: "Ej utsedd" }
    : locale === "en"
      ? { title: "Match Information", league: "League", season: "Season", round: "Round", stage: "Stage", venue: "Venue", city: "City", capacity: "Capacity", referee: "Referee", unavailable: "Not available", refereePending: "Not assigned" }
      : { title: "معلومات المباراة", league: "الدوري", season: "الموسم", round: "الجولة", stage: "المرحلة", venue: "الملعب", city: "المدينة", capacity: "السعة", referee: "الحكم", unavailable: "غير متوفر", refereePending: "لم يحدد" };
  const details = [
    [text.league, league?.name ?? text.unavailable],
    [text.season, season?.name ?? text.unavailable],
    [text.round, round ?? text.unavailable],
    [text.stage, stage ?? text.unavailable],
    [text.venue, venue?.name ?? text.unavailable],
    [text.city, venue?.city ?? text.unavailable],
    [text.capacity, formatCapacity(venue?.capacity, locale)],
    [text.referee, referee?.name ?? text.refereePending],
  ];
  return (
    <section className="rounded-2xl border border-cyan-400/10 bg-[#040a18] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-white">{text.title}</h2>
        {league?.logo && <div className="h-8 w-8 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${league.logo}")` }} />}
      </div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-slate-800/80 bg-slate-800/80 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {details.map(([label, value]) => (
          <div key={label} className="bg-[#061020] px-3 py-2.5">
            <p className="text-[12px] font-bold text-slate-500">{label}</p>
            <p className="mt-1 break-words text-[13px] font-black leading-5 text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getFactorLabels(
  locale: Locale,
): Record<string, string> {
  if (locale === "sv") {
    return {
      probability_strength: "Sannolikhetsstyrka",
      probability_margin: "Sannolikhetsmarginal",
      elo_signal: "Elo-signal",
      attack_signal: "Offensiv styrka",
      defense_signal: "Defensiv styrka",
      form_signal: "Aktuell form",
      data_quality: "Datakvalitet",
      xg_consistency: "xG-konsistens",
      market_clarity: "Marknadstydlighet",
    };
  }

  if (locale === "en") {
    return {
      probability_strength: "Probability strength",
      probability_margin: "Probability margin",
      elo_signal: "Elo signal",
      attack_signal: "Attacking strength",
      defense_signal: "Defensive strength",
      form_signal: "Current form",
      data_quality: "Data quality",
      xg_consistency: "xG consistency",
      market_clarity: "Market clarity",
    };
  }

  return {
    probability_strength: "قوة الاحتمال",
    probability_margin: "هامش الاحتمالات",
    elo_signal: "إشارة Elo",
    attack_signal: "القوة الهجومية",
    defense_signal: "القوة الدفاعية",
    form_signal: "الفورمة الحالية",
    data_quality: "جودة البيانات",
    xg_consistency: "اتساق xG",
    market_clarity: "وضوح السوق",
  };
}

function ProLockedSection({
  available,
  title,
  description,
  upgradeLabel,
  children,
}: {
  available: boolean;
  title: string;
  description: string;
  upgradeLabel: string;
  children: ReactNode;
}) {
  if (available) {
    return <>{children}</>;
  }

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-violet-500/25 bg-[#05091a] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.2)] sm:p-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-violet-500/10 blur-[80px]" />
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-xl shadow-[0_0_30px_rgba(139,92,246,0.12)]">🔒</div>
      <h2 className="relative mt-4 text-xl font-black text-white sm:text-2xl">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      <a
        href="/subscription"
        className="relative mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500 px-5 text-sm font-black text-white shadow-[0_12px_35px_rgba(124,58,237,0.24)] transition hover:bg-violet-400"
      >
        {upgradeLabel}
      </a>
    </section>
  );
}

export default async function MatchPage({
  params,
}: PageProps) {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const factorLabels = getFactorLabels(locale);

  const earlyPageText =
    locale === "sv"
      ? {
          invalidMatchId: "Ogiltigt match-ID",
          loginRequired: "Logga in för att visa matchanalysen.",
          unknownError: "Ett okänt fel inträffade",
          loadAnalysisFailed: "Det gick inte att ladda matchanalysen",
          missingTeamIds: (matchId: number) =>
            `Det gick inte att fastställa lagens ID för match ${matchId}`,
        }
      : locale === "en"
        ? {
            invalidMatchId: "Invalid match ID",
            loginRequired: "Please log in to view the match analysis.",
            unknownError: "An unknown error occurred",
            loadAnalysisFailed: "Unable to load match analysis",
            missingTeamIds: (matchId: number) =>
              `Unable to determine team IDs for match ${matchId}`,
          }
        : {
            invalidMatchId: "رقم المباراة غير صالح",
            loginRequired: "يرجى تسجيل الدخول لعرض تحليل المباراة.",
            unknownError: "حدث خطأ غير معروف",
            loadAnalysisFailed: "تعذر تحميل تحليل المباراة",
            missingTeamIds: (matchId: number) =>
              `تعذر تحديد معرفي الفريقين للمباراة رقم ${matchId}`,
          };

  const { id } = await params;
  const matchId = Number(id);

  if (!Number.isInteger(matchId) || matchId <= 0) {
    return (
      <main dir={direction} className="min-h-screen bg-[#020617] p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/30 bg-red-950/20 p-8">
          <h1 className="text-2xl font-black">
            {earlyPageText.invalidMatchId}
          </h1>
        </div>
      </main>
    );
  }

  let data: LatestPredictionResponse;

  try {
    const cookieStore = await cookies();

    const accessToken =
      cookieStore.get(
        "football_ai_access_token",
      )?.value;

    if (!accessToken) {
      const loginGate =
        locale === "sv"
          ? {
              badge: "MATCHANALYS",
              title: "Lås upp hela matchanalysen",
              description:
                "Få tillgång till Målx analys, sannolikheter, förväntade mål och matchprognoser.",
              featureOne: "Matchprognoser",
              featureOneSub: "Databaserade prognoser",
              featureTwo: "Vinstsannolikheter",
              featureTwoSub: "Analyser för varje utfall",
              featureThree: "Datadriven analys",
              featureThreeSub: "Djup statistik och insikter",
              register: "Skapa gratis konto",
              login: "Logga in",
              note: "Snabbt och säkert – gå med gratis på mindre än en minut",
              benefitOne: "Liveuppdateringar",
              benefitTwo: "Tillförlitliga data",
              benefitThree: "Ren upplevelse",
            }
          : locale === "en"
            ? {
                badge: "MATCH ANALYSIS",
                title: "Unlock the full match analysis",
                description:
                  "Access Målx analysis, probabilities, expected goals and match predictions.",
                featureOne: "Match predictions",
                featureOneSub: "Data-driven forecasts",
                featureTwo: "Win probabilities",
                featureTwoSub: "Outcome probability analysis",
                featureThree: "Data-driven analysis",
                featureThreeSub: "Advanced statistics and insights",
                register: "Create free account",
                login: "Sign in",
                note: "Fast and secure – join free in under a minute",
                benefitOne: "Live match updates",
                benefitTwo: "Reliable data",
                benefitThree: "Clean experience",
              }
            : {
                badge: "تحليل المباراة",
                title: "اكتشف التحليل الكامل للمباراة",
                description:
                  "سجّل دخولك للوصول إلى تحليل Målx، الاحتمالات، الأهداف المتوقعة وتوقعات المباراة.",
                featureOne: "توقعات المباراة",
                featureOneSub: "توقعات دقيقة مبنية على البيانات",
                featureTwo: "احتمالات الفوز",
                featureTwoSub: "تحليل احتمالات كل نتيجة",
                featureThree: "تحليل مبني على البيانات",
                featureThreeSub: "رؤى متقدمة وإحصائيات ذكية",
                register: "إنشاء حساب مجاني",
                login: "تسجيل الدخول",
                note: "سريع وآمن – انضم مجانًا في أقل من دقيقة",
                benefitOne: "تحديث لحظي للمباريات",
                benefitTwo: "بيانات موثوقة",
                benefitThree: "تجربة احترافية",
              };

      const gateFeatures = [
        {
          title: loginGate.featureOne,
          subtitle: loginGate.featureOneSub,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
              <path
                d="M5 20V10M12 20V4M19 20v-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ),
        },
        {
          title: loginGate.featureTwo,
          subtitle: loginGate.featureTwoSub,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
              <path
                d="M12 3a9 9 0 1 0 9 9h-9V3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M15 3.8A9 9 0 0 1 20.2 9H15V3.8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          ),
        },
        {
          title: loginGate.featureThree,
          subtitle: loginGate.featureThreeSub,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="6"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 2v4M12 18v4M2 12h4M18 12h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ),
        },
      ];

      return (
        <main
          dir={direction}
          className="relative min-h-screen overflow-hidden bg-[#020617] text-white"
        >
          <div
            className="absolute inset-0 scale-[1.02] bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/brand/malx-match-gate-bg.png')",
            }}
          />

          <div className="absolute inset-0 bg-slate-950/48" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/30 to-slate-950/80" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.12)_48%,rgba(2,6,23,0.78)_100%)]" />

          <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
            <section className="relative w-full max-w-5xl overflow-hidden rounded-[34px] border border-cyan-300/30 bg-slate-950/52 shadow-[0_30px_110px_rgba(0,0,0,0.58)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
              <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />

              <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border border-cyan-300/35 bg-slate-950/60 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.16)] backdrop-blur-xl">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-10 w-10"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 14v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="mt-5 text-center">
                  <span className="inline-flex rounded-full border border-cyan-300/30 bg-slate-950/60 px-5 py-2 text-[13px] font-black tracking-wide text-cyan-300 backdrop-blur-xl">
                    {loginGate.badge}
                  </span>
                </div>

                <h1 className="mx-auto mt-7 max-w-3xl text-center text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                  {loginGate.title}
                </h1>

                <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-7 text-slate-200/85 sm:text-base lg:text-lg">
                  {loginGate.description}
                </p>

                <div className="mx-auto mt-9 grid max-w-4xl gap-3 md:grid-cols-3">
                  {gateFeatures.map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-2xl border border-white/10 bg-slate-950/58 px-5 py-5 backdrop-blur-xl transition duration-300 hover:border-cyan-300/35 hover:bg-slate-900/70"
                    >
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 text-cyan-300">
                          {feature.icon}
                        </div>

                        <div>
                          <div className="text-sm font-black text-white">
                            {feature.title}
                          </div>
                          <div className="mt-1 text-[13px] leading-5 text-slate-400">
                            {feature.subtitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
                  <a
                    href="/register"
                    className="inline-flex min-h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-6 text-base font-black text-white shadow-[0_18px_45px_rgba(14,165,233,0.3)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    {loginGate.register}
                  </a>

                  <a
                    href="/login"
                    className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-cyan-300/35 bg-slate-950/60 px-6 text-base font-black text-white backdrop-blur-xl transition duration-300 hover:border-cyan-300/60 hover:bg-slate-900/80"
                  >
                    {loginGate.login}
                  </a>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-center text-sm font-bold text-cyan-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3 5 6v5c0 4.6 2.9 8.3 7 10 4.1-1.7 7-5.4 7-10V6l-7-3Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m9 12 2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span>{loginGate.note}</span>
                </div>

                <div className="mx-auto mt-9 grid max-w-4xl gap-3 rounded-2xl border border-white/10 bg-slate-950/48 p-3 backdrop-blur-xl sm:grid-cols-3">
                  {[
                    loginGate.benefitOne,
                    loginGate.benefitTwo,
                    loginGate.benefitThree,
                  ].map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.035] px-4 py-3 text-center text-[13px] font-bold text-slate-200 sm:text-sm"
                    >
                      <span className="text-cyan-300">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      );
    }

    data = await getPrediction(
      matchId,
      accessToken,
      locale,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : earlyPageText.unknownError;

    return (
      <main dir={direction} className="min-h-screen bg-[#020617] p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/30 bg-red-950/20 p-8">
          <h1 className="text-2xl font-black">
            {earlyPageText.loadAnalysisFailed}
          </h1>
          <p className="mt-3 break-words text-slate-400">
            {message}
          </p>
        </div>
      </main>
    );
  }

  const homeTeamId = Number(data.match.home_team_id);
  const awayTeamId = Number(data.match.away_team_id);

  if (
    !Number.isInteger(homeTeamId) ||
    homeTeamId <= 0 ||
    !Number.isInteger(awayTeamId) ||
    awayTeamId <= 0
  ) {
    throw new Error(
      earlyPageText.missingTeamIds(matchId),
    );
  }

  const [homeTeamStatistics, awayTeamStatistics] =
    await Promise.all([
      apiFetch<TeamStatisticsResponse>(
        `/teams/${homeTeamId}/statistics?last_matches=10`,
      ),
      apiFetch<TeamStatisticsResponse>(
        `/teams/${awayTeamId}/statistics?last_matches=10`,
      ),
    ]);

  const home: Team = {

    id: homeTeamId,

    name:
      data.match.home_team ??
      homeTeamStatistics.team_name ??
      (locale === "sv"
            ? "Hemmalaget"
            : locale === "en"
              ? "Home Team"
              : "الفريق المضيف"),

    country:
      data.match.home_country ??
      homeTeamStatistics.country ??
      undefined,

    logo:
      data.match.home_logo ??
      null,

    elo:
      homeTeamStatistics.calculated_ratings.elo,

    attack:
      homeTeamStatistics.calculated_ratings.attack,

    defense:
      homeTeamStatistics.calculated_ratings.defense,

    form:
      homeTeamStatistics.form_string,

    form_rating:
      homeTeamStatistics.form_rating,

    goals_scored:
      homeTeamStatistics.average_goals_scored,

    goals_conceded:
      homeTeamStatistics.average_goals_conceded,

    possession:
      homeTeamStatistics.match_averages.possession ?? undefined,

    shots:
      homeTeamStatistics.match_averages.shots ?? undefined,

    shots_on_target:
      homeTeamStatistics.match_averages.shots_on_target ?? undefined,

    corners:
      homeTeamStatistics.match_averages.corners ?? undefined,

    fouls:
      homeTeamStatistics.match_averages.fouls ?? undefined,

    yellow_cards:
      homeTeamStatistics.match_averages.yellow_cards ?? undefined,

    points:
      homeTeamStatistics.points,

    goal_difference:
      homeTeamStatistics.goal_difference,
  };

  const away: Team = {

    id: awayTeamId,

    name:
      data.match.away_team ??
      awayTeamStatistics.team_name ??
      (locale === "sv"
            ? "Bortalaget"
            : locale === "en"
              ? "Away Team"
              : "الفريق الضيف"),

    country:
      data.match.away_country ??
      awayTeamStatistics.country ??
      undefined,

    logo:
      data.match.away_logo ??
      null,

    elo:
      awayTeamStatistics.calculated_ratings.elo,

    attack:
      awayTeamStatistics.calculated_ratings.attack,

    defense:
      awayTeamStatistics.calculated_ratings.defense,

    form:
      awayTeamStatistics.form_string,

    form_rating:
      awayTeamStatistics.form_rating,

    goals_scored:
      awayTeamStatistics.average_goals_scored,

    goals_conceded:
      awayTeamStatistics.average_goals_conceded,

    possession:
      awayTeamStatistics.match_averages.possession ?? undefined,

    shots:
      awayTeamStatistics.match_averages.shots ?? undefined,

    shots_on_target:
      awayTeamStatistics.match_averages.shots_on_target ?? undefined,

    corners:
      awayTeamStatistics.match_averages.corners ?? undefined,

    fouls:
      awayTeamStatistics.match_averages.fouls ?? undefined,

    yellow_cards:
      awayTeamStatistics.match_averages.yellow_cards ?? undefined,

    points:
      awayTeamStatistics.points,

    goal_difference:
      awayTeamStatistics.goal_difference,
  };
  const result = data.markets.match_result;
  const highest = Math.max(
    result.home_win,
    result.draw,
    result.away_win,
  );

  const xg = data.prediction.expected_goals;
  const confidence = data.prediction.confidence;
  const totals15 = data.markets.totals["1.5"];
  const totals25 = data.markets.totals["2.5"];
  const totals35 = data.markets.totals["3.5"];

  const cornersForecast =
    data.match_events.corners;

  const yellowCardsForecast =
    data.match_events.yellow_cards;

  const actualCorners =
    data.evaluation?.actual_corners?.available
      ? data.evaluation.actual_corners
      : null;

  const actualYellowCards =
    data.evaluation?.actual_yellow_cards?.available
      ? data.evaluation.actual_yellow_cards
      : null;

  const cornersExplanation =
    cornersForecast?.explanation ?? null;

  const yellowCardsExplanation =
    yellowCardsForecast?.explanation ?? null;

  const cornerLines = Object.entries(
    cornersForecast?.over_probabilities ?? {},
  );

  const yellowCardLines = Object.entries(
    yellowCardsForecast?.over_probabilities ?? {},
  );

  const marketText =
    locale === "sv"
      ? {
          over: "Över ",
          no: "Nej",
          btts: "Båda lagen gör mål",
          homeOrDraw: "Hemma eller oavgjort 1X",
          awayOrDraw: "Borta eller oavgjort X2",
          noDraw: "Ingen oavgjord 12",
          dnbHome: "Draw No Bet — hemma",
          dnbAway: "Draw No Bet — borta",
          over15: "Över 1.5 mål",
          over25: "Över 2.5 mål",
          under25: "Under 2.5 mål",
          under35: "Under 3.5 mål",
          homeWinToNil: "Hemmaseger utan insläppt mål",
          awayWinToNil: "Bortaseger utan insläppt mål",
          attack: "Anfall",
          defense: "Försvar",
          form: "Form",
          goalsScored: "Gjorda mål",
          goalsConceded: "Insläppta mål",
          possession: "Bollinnehav",
          shots: "Skott",
          shotsOnTarget: "Skott på mål",
          corners: "Hörnor",
          fouls: "Frisparkar/fouls",
          yellowCards: "Gula kort",
          points: "Poäng",
          goalDifference: "Målskillnad",
        }
      : locale === "en"
        ? {
            over: "Over ",
            no: "No",
            btts: "Both Teams to Score",
            homeOrDraw: "Home or Draw 1X",
            awayOrDraw: "Away or Draw X2",
            noDraw: "No Draw 12",
            dnbHome: "Draw No Bet — Home",
            dnbAway: "Draw No Bet — Away",
            over15: "Over 1.5 Goals",
            over25: "Over 2.5 Goals",
            under25: "Under 2.5 Goals",
            under35: "Under 3.5 Goals",
            homeWinToNil: "Home Win to Nil",
            awayWinToNil: "Away Win to Nil",
            attack: "Attack",
            defense: "Defense",
            form: "Form",
            goalsScored: "Goals Scored",
            goalsConceded: "Goals Conceded",
            possession: "Possession",
            shots: "Shots",
            shotsOnTarget: "Shots on Target",
            corners: "Corners",
            fouls: "Fouls",
            yellowCards: "Yellow Cards",
            points: "Points",
            goalDifference: "Goal Difference",
          }
        : {
            over: "أكثر من ",
            no: "لا",
            btts: "تسجيل الفريقين",
            homeOrDraw: "المضيف أو التعادل 1X",
            awayOrDraw: "الضيف أو التعادل X2",
            noDraw: "لا تعادل 12",
            dnbHome: "تعادل لا رهان — المضيف",
            dnbAway: "تعادل لا رهان — الضيف",
            over15: "أكثر من 1.5 هدف",
            over25: "أكثر من 2.5 هدف",
            under25: "أقل من 2.5 هدف",
            under35: "أقل من 3.5 هدف",
            homeWinToNil: "فوز المضيف دون استقبال",
            awayWinToNil: "فوز الضيف دون استقبال",
            attack: "الهجوم",
            defense: "الدفاع",
            form: "الفورمة",
            goalsScored: "الأهداف المسجلة",
            goalsConceded: "الأهداف المستقبلة",
            possession: "الاستحواذ",
            shots: "التسديدات",
            shotsOnTarget: "التسديدات على المرمى",
            corners: "الركنيات",
            fouls: "الأخطاء",
            yellowCards: "البطاقات الصفراء",
            points: "النقاط",
            goalDifference: "فارق الأهداف",
          };

  const pageText =
    locale === "sv"
      ? {
          quickOverview: "Snabböversikt",
          predictionSummary: "Sammanfattning av matchprognosen",
          preMatch: "Före match",
          totalExpectedGoals: "Totalt förväntade mål",
          goalUnit: "mål",
          expectedCorners: "Förväntade hörnor",
          cornerUnit: "hörnor",
          expectedYellowCards: "Förväntade gula kort",
          cardUnit: "kort",
          predictionConfidence: "Prognossäkerhet",
          engineConfidenceLevel: "Modellens säkerhetsnivå",
          unavailable: "Ej tillgängligt",

          matchResultProbabilities: "Sannolikheter för matchresultat",
          homeWin: (team: string) => `${team} vinner`,
          draw: "Oavgjort",
          awayWin: (team: string) => `${team} vinner`,

          bestPrediction: "Bästa prognos",
          highestProbability: "Högsta sannolikhet",
          highest: "Högst",
          probabilityMargin: "Sannolikhetsmarginal",

          scoreDistribution: "Resultatfördelning",
          exactScoreReading: "Analys av exakt resultat",
          exactScoreDescription:
            "Jämförelse mellan det enskilt mest sannolika resultatet och resultatet som bäst stämmer överens med den förväntade vinnaren.",
          highestSingleScore: "Mest sannolika enskilda resultat",
          probability: "Sannolikhet",
          winnerConsistentScore:
            "Resultat som stämmer överens med vinnarprognosen",
          scoreMismatch:
            "Det mest sannolika enskilda resultatet matchar inte den starkaste utfallskategorin i matchens sannolikheter. Modellen visar därför ett andra resultat som bättre stämmer överens med vinnarprognosen utan att ändra de ursprungliga sannolikheterna.",
          scoreConsistent:
            "Det mest sannolika exakta resultatet stämmer överens med vinnarprognosen.",

          topPredictionMarkets: "Viktigaste prognosmarknaderna",
          advancedMarketsPro: "Avancerade marknader är tillgängliga i Pro",
          advancedMarketsDescription:
            "Uppgradera för att visa båda lagen gör mål, Double Chance, Over / Under, Draw No Bet och andra avancerade marknader.",
          upgradeSubscription: "Uppgradera abonnemang",
          invalidMatchId: "Ogiltigt match-ID",
          loginRequired: "Logga in för att visa matchanalysen.",
          unknownError: "Ett okänt fel inträffade",
          loadAnalysisFailed: "Det gick inte att ladda matchanalysen",
          missingTeamIds: (matchId: number) =>
            `Det gick inte att fastställa lagens ID för match ${matchId}`,


          matchEventsPro: "Prognos för matchhändelser är tillgänglig i Pro",
          matchEventsProDescription:
            "Uppgradera för att visa prognoser för hörnor, kort och avancerad analys av matchhändelser.",
          matchEventsForecast: "Prognos för matchhändelser",
          matchEventsDescription:
            "Faktiska matchprognoser, inte bara lagens historiska genomsnitt.",
          howCornersCalculated: "Hur beräknades hörnprognosen?",
          howCardsCalculated: "Hur beräknades kortprognosen?",
          calculationMethod: "Beräkningsmetod:",
          statisticalDistribution: "Statistisk fördelning:",
          formula: "Formel:",
          expectedCornersNote: "Förväntade hörnor",
          expectedCardsNote: "Förväntade kort",
          actualResult: "Faktiskt resultat",
          actualCornersNote: "Faktiska hörnor",
          actualCardsNote: "Faktiska gula kort",
          matchTotal: "Matchtotal",
          likelyRange: "Troligt intervall",
          expectedTotal: "Förväntad total",
          cornersUnavailable: "Hörnprognosen är inte tillgänglig för denna match.",
          cardsUnavailable: "Kortprognosen är inte tillgänglig för denna match.",
          refereeAdjusted: "Domarens påverkan har tillämpats på prognosen.",
          refereeNotAdjusted: "Ingen särskild domarpåverkan har tillämpats på prognosen.",
          teamComparisonPro: "Lagjämförelse är tillgänglig i Pro",
          teamComparisonProDescription:
            "Uppgradera för att visa lagstatistik och en detaljerad jämförelse av anfall, försvar och form.",
          teamComparison: "Lagjämförelse",
          metric: "Mätvärde",
          topScoresPro: "De mest sannolika resultaten är tillgängliga i Pro",
          topScoresProDescription:
            "Uppgradera för att visa de mest sannolika exakta resultaten och sannolikheten för varje resultat.",
          topScores: "Mest sannolika resultat",
          modelAlerts: "Varningar och modellanalys",
          noWarnings: "Inga varningar.",
          confidenceFactorsPro: "Detaljerade konfidensfaktorer är tillgängliga i Pro",
          confidenceFactorsProDescription:
            "Uppgradera för att visa detaljerad analys av konfidensfaktorer som sannolikhetsstyrka, datakvalitet, prestationssignaler och marknadstydlighet.",
          confidenceFactors: "Konfidensfaktorer",
        }
      : locale === "en"
        ? {
            quickOverview: "Quick Overview",
            predictionSummary: "Match Prediction Summary",
            preMatch: "Pre-Match",
            totalExpectedGoals: "Total Expected Goals",
            goalUnit: "goals",
            expectedCorners: "Expected Corners",
            cornerUnit: "corners",
            expectedYellowCards: "Expected Yellow Cards",
            cardUnit: "cards",
            predictionConfidence: "Prediction Confidence",
            engineConfidenceLevel: "Model Confidence Level",
            unavailable: "Unavailable",

            matchResultProbabilities: "Match Result Probabilities",
            homeWin: (team: string) => `${team} Win`,
            draw: "Draw",
            awayWin: (team: string) => `${team} Win`,

            bestPrediction: "Best Prediction",
            highestProbability: "Highest Probability",
            highest: "Highest",
            probabilityMargin: "Probability Margin",

            scoreDistribution: "Score Distribution",
            exactScoreReading: "Exact Score Analysis",
            exactScoreDescription:
              "A comparison between the single most likely score and the score most consistent with the predicted winner.",
            highestSingleScore: "Highest Single Score",
            probability: "Probability",
            winnerConsistentScore:
              "Score Consistent with the Predicted Winner",
            scoreMismatch:
              "The highest single score does not match the strongest outcome category in the match probabilities. The model therefore shows a second score that is more consistent with the predicted winner without changing the original probabilities.",
            scoreConsistent:
              "The highest exact score is consistent with the predicted winner.",

            topPredictionMarkets: "Top Prediction Markets",
            advancedMarketsPro: "Advanced Markets Available on Pro",
            advancedMarketsDescription:
              "Upgrade to view Both Teams to Score, Double Chance, Over / Under, Draw No Bet and other advanced markets.",
            upgradeSubscription: "Upgrade Subscription",
            invalidMatchId: "Invalid match ID",
            loginRequired: "Please log in to view the match analysis.",
            unknownError: "An unknown error occurred",
            loadAnalysisFailed: "Unable to load match analysis",
            missingTeamIds: (matchId: number) =>
              `Unable to determine team IDs for match ${matchId}`,


            matchEventsPro: "Match Event Predictions Available on Pro",
            matchEventsProDescription:
              "Upgrade to view corner and card predictions and advanced match-event analysis.",
            matchEventsForecast: "Match Events Forecast",
            matchEventsDescription:
              "Actual match forecasts, not just the teams' historical averages.",
            howCornersCalculated: "How was the corner forecast calculated?",
            howCardsCalculated: "How was the card forecast calculated?",
            calculationMethod: "Calculation method:",
            statisticalDistribution: "Statistical distribution:",
            formula: "Formula:",
            expectedCornersNote: "Expected corners",
            expectedCardsNote: "Expected cards",
            actualResult: "Actual Result",
            actualCornersNote: "Actual corners",
            actualCardsNote: "Actual yellow cards",
            matchTotal: "Match Total",
            likelyRange: "Likely range",
            expectedTotal: "Expected total",
            cornersUnavailable: "Corner prediction is unavailable for this match.",
            cardsUnavailable: "Card prediction is unavailable for this match.",
            refereeAdjusted: "The referee effect was applied to the prediction.",
            refereeNotAdjusted: "No custom referee effect was applied to the prediction.",
            teamComparisonPro: "Team Comparison Available on Pro",
            teamComparisonProDescription:
              "Upgrade to view team statistics and a detailed comparison of attacking, defensive and form performance.",
            teamComparison: "Team Comparison",
            metric: "Metric",
            topScoresPro: "Most Likely Scores Available on Pro",
            topScoresProDescription:
              "Upgrade to view the most likely exact scores and the probability of each score.",
            topScores: "Most Likely Scores",
            modelAlerts: "Model Alerts and Analysis",
            noWarnings: "No warnings.",
            confidenceFactorsPro: "Detailed Confidence Factors Available on Pro",
            confidenceFactorsProDescription:
              "Upgrade to view detailed confidence-factor analysis such as probability strength, data quality, performance signals and market clarity.",
            confidenceFactors: "Confidence Factors",
          }
        : {
            quickOverview: "نظرة سريعة",
            predictionSummary: "ملخص توقعات المباراة",
            preMatch: "قبل المباراة",
            totalExpectedGoals: "إجمالي الأهداف المتوقعة",
            goalUnit: "هدف",
            expectedCorners: "الركنيات المتوقعة",
            cornerUnit: "ركنية",
            expectedYellowCards: "البطاقات الصفراء المتوقعة",
            cardUnit: "بطاقة",
            predictionConfidence: "ثقة التوقع",
            engineConfidenceLevel: "مستوى ثقة المحرك",
            unavailable: "غير متوفر",

            matchResultProbabilities: "احتمالات نتيجة المباراة",
            homeWin: (team: string) => `فوز ${team}`,
            draw: "التعادل",
            awayWin: (team: string) => `فوز ${team}`,

            bestPrediction: "أفضل توقع",
            highestProbability: "أعلى احتمال",
            highest: "الأعلى",
            probabilityMargin: "هامش الاحتمالات",

            scoreDistribution: "توزيع احتمالات النتائج",
            exactScoreReading: "قراءة النتيجة الدقيقة",
            exactScoreDescription:
              "مقارنة بين أعلى نتيجة منفردة والنتيجة الأكثر اتساقًا مع توقع الفائز.",
            highestSingleScore: "أعلى نتيجة منفردة",
            probability: "الاحتمال",
            winnerConsistentScore:
              "النتيجة المتوافقة مع توقع الفائز",
            scoreMismatch:
              "أعلى نتيجة منفردة لا تطابق فئة النتيجة الأقوى في احتمالات المباراة. لذلك يعرض النموذج نتيجة ثانية أكثر اتساقًا مع توقع الفائز، من دون تغيير الاحتمالات الأصلية.",
            scoreConsistent:
              "النتيجة الدقيقة الأعلى متوافقة مع توقع الفائز.",

            topPredictionMarkets: "أهم أسواق التوقع",
            advancedMarketsPro: "الأسواق المتقدمة متاحة في خطة Pro",
            advancedMarketsDescription:
              "قم بالترقية لعرض تسجيل الفريقين، Double Chance، Over / Under، Draw No Bet والأسواق المتقدمة الأخرى.",
            upgradeSubscription: "ترقية الاشتراك",
            invalidMatchId: "رقم المباراة غير صالح",
            loginRequired: "يرجى تسجيل الدخول لعرض تحليل المباراة.",
            unknownError: "حدث خطأ غير معروف",
            loadAnalysisFailed: "تعذر تحميل تحليل المباراة",
            missingTeamIds: (matchId: number) =>
              `تعذر تحديد معرفي الفريقين للمباراة رقم ${matchId}`,


            matchEventsPro: "توقع أحداث المباراة متاح في خطة Pro",
            matchEventsProDescription:
              "قم بالترقية لعرض توقع الركنيات والبطاقات وتحليلات أحداث المباراة المتقدمة.",
            matchEventsForecast: "توقع أحداث المباراة",
            matchEventsDescription: "توقعات المباراة الفعلية، وليست مجرد متوسطات الفرق التاريخية.",
            howCornersCalculated: "كيف تم حساب توقع الركنيات؟",
            howCardsCalculated: "كيف تم حساب توقع البطاقات؟",
            calculationMethod: "طريقة الحساب:",
            statisticalDistribution: "التوزيع الإحصائي:",
            formula: "المعادلة:",
            expectedCornersNote: "ركنيات متوقعة",
            expectedCardsNote: "بطاقات متوقعة",
            actualResult: "النتيجة الفعلية",
            actualCornersNote: "الركنيات الفعلية",
            actualCardsNote: "البطاقات الصفراء الفعلية",
            matchTotal: "إجمالي المباراة",
            likelyRange: "النطاق المرجح",
            expectedTotal: "الإجمالي المتوقع",
            cornersUnavailable: "توقع الركنيات غير متاح لهذه المباراة.",
            cardsUnavailable: "توقع البطاقات غير متاح لهذه المباراة.",
            refereeAdjusted: "تم تطبيق تأثير الحكم على التوقع.",
            refereeNotAdjusted: "لم يُطبق تأثير حكم مخصص على التوقع.",
            teamComparisonPro: "مقارنة الفريقين متاحة في خطة Pro",
            teamComparisonProDescription:
              "قم بالترقية لعرض إحصائيات الفريقين والمقارنة التفصيلية بين الأداء الهجومي والدفاعي والفورمة.",
            teamComparison: "مقارنة الفريقين",
            metric: "المؤشر",
            topScoresPro: "النتائج الأكثر احتمالًا متاحة في خطة Pro",
            topScoresProDescription:
              "قم بالترقية لعرض النتائج الدقيقة الأكثر احتمالًا ونسب كل نتيجة.",
            topScores: "النتائج الأكثر احتمالًا",
            modelAlerts: "تنبيهات وتحليل النموذج",
            noWarnings: "لا توجد تحذيرات.",
            confidenceFactorsPro: "عوامل الثقة التفصيلية متاحة في خطة Pro",
            confidenceFactorsProDescription:
              "قم بالترقية لعرض تحليل عوامل الثقة التفصيلية مثل قوة الاحتمال، جودة البيانات، إشارات الأداء ووضوح السوق.",
            confidenceFactors: "عوامل الثقة",
          };
  const marketLineLabel = (
    key: string,
  ): string =>
    key
      .replace("over_", marketText.over)
      .replaceAll("_", ".");

  const marketCards = [
    [
      marketText.btts,
      data.markets.btts.yes,
      `${marketText.no}: ${pct(data.markets.btts.no)}`,
    ],
    [
      marketText.homeOrDraw,
      data.markets.double_chance.home_or_draw_1x,
      "",
    ],
    [
      marketText.awayOrDraw,
      data.markets.double_chance.draw_or_away_x2,
      "",
    ],
    [
      marketText.noDraw,
      data.markets.double_chance.home_or_away_12,
      "",
    ],
    [
      marketText.dnbHome,
      data.markets.draw_no_bet.home,
      "",
    ],
    [
      marketText.dnbAway,
      data.markets.draw_no_bet.away,
      "",
    ],
    [
      marketText.over15,
      totals15?.over ?? 0,
      "",
    ],
    [
      marketText.over25,
      totals25?.over ?? 0,
      "",
    ],
    [
      marketText.under25,
      totals25?.under ?? 0,
      "",
    ],
    [
      marketText.under35,
      totals35?.under ?? 0,
      "",
    ],
    [
      marketText.homeWinToNil,
      data.markets.win_to_nil.home,
      "",
    ],
    [
      marketText.awayWinToNil,
      data.markets.win_to_nil.away,
      "",
    ],
  ] as const;

  const marketGroups = [
    {
      key: "result",
      title:
        locale === "sv"
          ? "Resultat & chanser"
          : locale === "en"
            ? "Result & Chances"
            : "النتيجة والفرص",
      markets: marketCards.slice(1, 6),
    },
    {
      key: "goals",
      title:
        locale === "sv"
          ? "Mål"
          : locale === "en"
            ? "Goals"
            : "الأهداف",
      markets: marketCards.slice(6, 10),
    },
    {
      key: "btts",
      title:
        locale === "sv"
          ? "Båda lagen gör mål"
          : locale === "en"
            ? "Both Teams to Score"
            : "تسجيل الفريقين",
      markets: marketCards.slice(0, 1),
    },
    {
      key: "team",
      title:
        locale === "sv"
          ? "Lagmarknader"
          : locale === "en"
            ? "Team Markets"
            : "أسواق الفريق",
      markets: marketCards.slice(10, 12),
    },
  ] as const;
  const comparisons = [
    ["Elo", home.elo, away.elo],
    [marketText.attack, home.attack, away.attack],
    [marketText.defense, home.defense, away.defense],
    [marketText.form, home.form_rating, away.form_rating],
    [
      marketText.goalsScored,
      home.goals_scored,
      away.goals_scored,
    ],
    [
      marketText.goalsConceded,
      home.goals_conceded,
      away.goals_conceded,
    ],
    [
      marketText.possession,
      home.possession,
      away.possession,
    ],
    [
      marketText.shots,
      home.shots,
      away.shots,
    ],
    [
      marketText.shotsOnTarget,
      home.shots_on_target,
      away.shots_on_target,
    ],
    [
      marketText.corners,
      home.corners,
      away.corners,
    ],
    [
      marketText.fouls,
      home.fouls,
      away.fouls,
    ],
    [
      marketText.yellowCards,
      home.yellow_cards,
      away.yellow_cards,
    ],
    [
      marketText.points,
      home.points,
      away.points,
    ],
    [
      marketText.goalDifference,
      home.goal_difference,
      away.goal_difference,
    ],
  ] as const;



  const fairOddsText =
    locale === "sv"
      ? {
          eyebrow: "MODELLPRISER",
          title: "Rättvisa 1X2-odds",
          description: "Beräknade direkt från modellens sannolikheter. De är en analytisk referens och inte liveodds från ett spelbolag.",
          fairPrice: "Rättvist odds",
          notBookmaker: "Inte spelbolagsodds",
        }
      : locale === "en"
        ? {
            eyebrow: "MODEL PRICES",
            title: "Fair 1X2 Odds",
            description: "Calculated directly from the model probabilities. These are an analytical reference, not live bookmaker prices.",
            fairPrice: "Fair price",
            notBookmaker: "Not bookmaker odds",
          }
        : {
            eyebrow: "أسعار الموديل",
            title: "الأسعار العادلة لنتيجة 1X2",
            description: "محسوبة مباشرة من احتمالات الموديل، وهي مرجع تحليلي وليست أسعارًا مباشرة من شركة مراهنات.",
            fairPrice: "السعر العادل",
            notBookmaker: "ليست أسعار شركة مراهنات",
          };

  return (
    <main
      dir={direction}
      className="malx-match-page min-h-screen bg-[#020611] px-3 py-4 text-white sm:px-5 lg:px-6"
    >
      <div className="mx-auto max-w-[1560px] space-y-3">
        <LatestMatchHero
          matchId={data.match.id}
          status={data.match.status}
          homeScore={data.match.home_score}
          awayScore={data.match.away_score}
          isFinished={data.match.is_finished}
          actualOutcome={data.match.actual_outcome}
          evaluation={data.evaluation}
          matchDate={formatDate(data.match.date, locale)}
          leagueName={data.league?.name ?? null}
          venueName={data.venue?.name ?? null}
          homeTeam={home}
          awayTeam={away}
          homeExpectedGoals={xg.home_expected_goals}
          awayExpectedGoals={xg.away_expected_goals}
          totalExpectedGoals={xg.total_expected_goals}
          homeWin={result.home_win}
          draw={result.draw}
          awayWin={result.away_win}
          mostLikelyScore={
            data.prediction.most_likely_score.score
          }
          scoreProbability={
            data.prediction.most_likely_score.probability
          }
        />

        <MatchDashboardOverview
          home={home}
          away={away}
          comparisons={comparisons}
          topScores={data.markets.top_scores}
          homeXg={xg.home_expected_goals}
          awayXg={xg.away_expected_goals}
          totalXg={xg.total_expected_goals}
          confidence={confidence.value}
          homeWin={result.home_win}
          draw={result.draw}
          awayWin={result.away_win}
          advancedAvailable={data.markets.advanced_available}
        />

        {/* Protected overview ends here. V7 readability layout starts below. */}

        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-400/15 bg-[#04101d] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/[0.08] text-sm font-black text-cyan-300">AI</span>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400">MÅLX INTELLIGENCE FLOW</p>
                <p className="mt-0.5 text-[13px] text-slate-500">{locale === "ar" ? "قراءة مركزة للتوقعات والأحداث والأسواق" : locale === "sv" ? "Kompakt läsning av prognoser, händelser och marknader" : "Compact reading of predictions, events and markets"}</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-2.5 py-1 text-sm font-black text-emerald-300">{locale === "ar" ? "تحليل النموذج" : locale === "sv" ? "MODELLANALYS" : "MODEL ANALYSIS"}</span>
          </div>

            {/* Real bookmaker market odds */}
            <MatchOdds data={data.odds_data} />

          <section className="rounded-2xl border border-cyan-400/15 bg-[#040a18] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-400">{fairOddsText.eyebrow}</p>
                <h2 className="mt-1 text-xl font-black text-white">{fairOddsText.title}</h2>
                <p className="mt-1 max-w-4xl text-sm leading-5 text-slate-400">{fairOddsText.description}</p>
              </div>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.05] px-2.5 py-1 text-sm font-black text-amber-300">{fairOddsText.notBookmaker}</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                [pageText.homeWin(home.name), result.home_win, "1"],
                [pageText.draw, result.draw, "X"],
                [pageText.awayWin(away.name), result.away_win, "2"],
              ].map(([label, probability, code]) => {
                const numericProbability = Number(probability);
                const isLeader = numericProbability === Math.max(result.home_win, result.draw, result.away_win);
                return (
                  <article key={String(label)} className={["rounded-xl border px-3 py-3", isLeader ? "border-cyan-400/35 bg-cyan-400/[0.05]" : "border-slate-800 bg-slate-950/35"].join(" ")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-sm font-black text-slate-300">{code}</span>
                        <span className="truncate text-sm font-black text-slate-300">{label}</span>
                      </div>
                      <strong dir="ltr" className={["text-sm font-black tabular-nums", confidenceTone(numericProbability).text].join(" ")}>{pct(numericProbability)}</strong>
                    </div>
                    <div className="mt-2 flex items-end justify-between border-t border-slate-800/70 pt-2">
                      <span className="text-[13px] font-bold text-slate-500">{fairOddsText.fairPrice}</span>
                      <strong dir="ltr" className="text-2xl font-black tabular-nums text-white">{fairOdds(numericProbability)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-violet-400/15 bg-[#05091a] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
                  AI SCORE INTERPRETATION
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  {pageText.exactScoreReading}
                </h2>
              </div>

              <span className="rounded-full border border-slate-700 px-2 py-1 text-sm font-bold text-slate-500">
                {pageText.scoreDistribution}
              </span>
            </div>

            <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.05] px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold text-slate-400">
                    {pageText.highestSingleScore}
                  </p>

                  <strong
                    dir="ltr"
                    className="mt-1 block text-4xl font-black tabular-nums text-violet-300"
                  >
                    {data.prediction.most_likely_score.score}
                  </strong>
                </div>

                <div className="text-end">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    Probability
                  </p>

                  <strong
                    dir="ltr"
                    className="mt-1 block text-xl font-black tabular-nums text-violet-200"
                  >
                    {pct(data.prediction.most_likely_score.probability)}
                  </strong>
                </div>
              </div>
            </div>

            {data.markets.top_scores.filter(
              (score, index, scores) =>
                score.score !== data.prediction.most_likely_score.score &&
                scores.findIndex((item) => item.score === score.score) === index,
            ).length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-500">
                    {locale === "ar"
                      ? "النتائج البديلة"
                      : locale === "sv"
                        ? "Alternativa resultat"
                        : "Alternative scorelines"}
                  </p>

                  <span className="text-[11px] font-bold text-slate-600">
                    Top 4
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {data.markets.top_scores
                    .filter(
                      (score, index, scores) =>
                        score.score !== data.prediction.most_likely_score.score &&
                        scores.findIndex((item) => item.score === score.score) === index,
                    )
                    .slice(0, 4)
                    .map((score) => (
                      <div
                        key={score.score}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/45 px-3 py-3"
                      >
                        <strong
                          dir="ltr"
                          className="text-xl font-black tabular-nums text-white"
                        >
                          {score.score}
                        </strong>

                        <span
                          dir="ltr"
                          className="text-[13px] font-black tabular-nums text-cyan-300"
                        >
                          {pct(score.probability)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2 text-[12px] font-bold leading-5 text-slate-500">
              {locale === "ar"
                ? "النتيجة الرئيسية هي أعلى نتيجة منفردة من توزيع الاحتمالات، وتوضح النتائج البديلة السيناريوهات التالية الأكثر احتمالًا."
                : locale === "sv"
                  ? "Huvudresultatet är det enskilt mest sannolika resultatet, medan alternativen visar de näst mest sannolika scenarierna."
                  : "The primary score is the highest-probability single score, while the alternatives show the next most likely scorelines."}
            </p>
          </section>

          <div className="space-y-3">
            <ProLockedSection available={data.markets.advanced_available} upgradeLabel={pageText.upgradeSubscription} title={pageText.matchEventsPro} description={pageText.matchEventsProDescription}>
            <section className="h-full rounded-2xl border border-slate-800 bg-[#040a18] p-4">
              <div className="mb-3"><p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-400">MATCH EVENT ENGINE</p><h2 className="mt-1 text-xl font-black text-white">{pageText.matchEventsForecast}</h2></div>
              <div className="grid gap-3 xl:grid-cols-2">
                {[
                  { key: "corners", title: pageText.expectedCorners, total: cornersForecast?.total_expected, homeValue: cornersForecast?.home_expected, awayValue: cornersForecast?.away_expected, range: cornersForecast?.most_likely_range, lines: cornerLines, actual: actualCorners, unit: pageText.cornerUnit, accent: "cyan" },
                  { key: "cards", title: pageText.expectedYellowCards, total: yellowCardsForecast?.total_expected, homeValue: yellowCardsForecast?.home_expected, awayValue: yellowCardsForecast?.away_expected, range: yellowCardsForecast?.most_likely_range, lines: yellowCardLines, actual: actualYellowCards, unit: pageText.cardUnit, accent: "amber" },
                ].map((event) => (
                  <article key={event.key} className={["rounded-xl border p-3", event.accent === "cyan" ? "border-cyan-400/20 bg-cyan-400/[0.025]" : "border-amber-400/20 bg-amber-400/[0.025]"].join(" ")}>
                    <div className="flex items-center justify-between gap-3"><h3 className={["text-[15px] font-black", event.accent === "cyan" ? "text-cyan-200" : "text-amber-200"].join(" ")}>{event.title}</h3><strong dir="ltr" className={["text-[1.85rem] font-black", event.accent === "cyan" ? "text-cyan-300" : "text-amber-300"].join(" ")}>{event.total != null ? Number(event.total).toFixed(2) : "—"}</strong></div>
                    {event.total != null ? <>
                      <div className="mt-2 grid grid-cols-3 gap-2"><StatCard title={home.name} value={Number(event.homeValue ?? 0).toFixed(2)} /><StatCard title={away.name} value={Number(event.awayValue ?? 0).toFixed(2)} /><StatCard title={pageText.matchTotal} value={Number(event.total).toFixed(2)} note={event.range ? `${event.range.minimum}-${event.range.maximum}` : undefined} /></div>
                      {event.actual && <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5 text-sm"><span className="font-bold text-emerald-300">{pageText.actualResult}</span><strong dir="ltr" className="font-black text-white">{Number(event.actual.home ?? 0).toFixed(0)} — {Number(event.actual.away ?? 0).toFixed(0)} ({Number(event.actual.total ?? 0).toFixed(0)})</strong></div>}
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">{event.lines.map(([key, value]) => <ProgressCard key={key} title={`${marketLineLabel(key)} ${event.unit}`} value={Number(value)} />)}</div>
                    </> : <p className="mt-3 text-[13px] text-slate-500">{event.key === "corners" ? pageText.cornersUnavailable : pageText.cardsUnavailable}</p>}
                  </article>
                ))}
              </div>
            </section>
            </ProLockedSection>

            <MatchInfoCard league={data.league} season={data.season} round={data.round} stage={data.stage} venue={data.venue} referee={data.referee} locale={locale} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#040a18] p-1"><ProScoreMatrix matrix={data.markets.score_matrix} mostLikelyScore={data.prediction.most_likely_score.score} recommendedScore={data.prediction.recommended_score.score} homeWin={data.markets.match_result.home_win} draw={data.markets.match_result.draw} awayWin={data.markets.match_result.away_win} /></div>

          <section className="rounded-2xl border border-amber-400/15 bg-[#040a18] p-4">
            <div className="flex items-center justify-between"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-amber-400">MODEL CHECKS</p><h2 className="mt-1 text-base font-black text-white">{pageText.modelAlerts}</h2></div><span className="rounded-lg border border-amber-400/15 px-2 py-1 text-sm font-black text-amber-300">{data.analysis.warnings.length}</span></div>
            {data.analysis.warnings.length > 0 ? <ul className="mt-3 grid gap-2 md:grid-cols-2">{data.analysis.warnings.map((warning, index) => <li key={`${warning}-${index}`} className="rounded-lg border border-amber-400/10 bg-amber-400/[0.03] px-3 py-2 text-[13px] leading-4 text-slate-300">• {translateModelWarning(warning, locale)}</li>)}</ul> : <p className="mt-3 text-sm font-bold text-emerald-300">{pageText.noWarnings}</p>}
          </section>

          <ProLockedSection available={data.markets.advanced_available} upgradeLabel={pageText.upgradeSubscription} title={pageText.confidenceFactorsPro} description={pageText.confidenceFactorsProDescription}>
            <section className="rounded-2xl border border-emerald-400/12 bg-[#040a18] p-4">
              <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-400">CONFIDENCE ENGINE</p><h2 className="mt-1 text-xl font-black text-white">{pageText.confidenceFactors}</h2></div><strong dir="ltr" className="text-xl font-black text-emerald-300">{Math.round(confidence.value)}<span className="text-[13px] text-slate-600">/100</span></strong></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(data.analysis.confidence_factors).map(([key, value]) => <ProgressCard key={key} title={factorLabels[key] ?? key} value={value} />)}</div>
            </section>
          </ProLockedSection>

          <section className="rounded-2xl border border-violet-400/15 bg-[#040919] p-4">
            <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-[0.18em] text-violet-400">PREDICTION MARKETS</p><h2 className="mt-1 text-xl font-black text-white">{pageText.topPredictionMarkets}</h2></div>{data.markets.advanced_available && <span className="text-sm font-black text-violet-300">{marketCards.length} {locale === "sv" ? "marknader" : locale === "en" ? "markets" : "سوقًا"}</span>}</div>
            {data.markets.advanced_available ? <div className="mt-3 grid gap-2 lg:grid-cols-2">{marketGroups.map((group) => <div key={group.key} className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-3"><h3 className="mb-2 text-sm font-black text-slate-400">{group.title}</h3><div className="space-y-2.5">{group.markets.map(([title, value, note]) => { const marketValue=Math.max(0,Math.min(100,Number(value)||0)); return <div key={title}><div className="flex items-center justify-between gap-3"><span className="min-w-0 text-[13px] font-bold leading-5 text-slate-200">{group.key === "btts" ? (locale === "sv" ? "Ja" : locale === "en" ? "Yes" : "نعم") : title}</span><strong dir="ltr" className={["text-sm font-black", confidenceTone(marketValue).text].join(" ")}>{pct(marketValue)}</strong></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-900"><div className={["h-full rounded-full", confidenceTone(marketValue).fill].join(" ")} style={{width:`${marketValue}%`}} /></div>{note && <span className="mt-1 block text-[13px] leading-4 text-slate-500">{note}</span>}{group.key === "btts" && <div className="mt-1 flex justify-between text-[13px] text-slate-500"><span>{marketText.no}</span><strong dir="ltr" className="text-violet-300">{pct(data.markets.btts.no)}</strong></div>}</div>})}</div></div>)}</div> : <div className="mt-3 rounded-xl border border-violet-400/15 bg-violet-400/[0.04] px-4 py-5 text-center"><h3 className="text-sm font-black text-white">{pageText.advancedMarketsPro}</h3><p className="mt-1 text-[13px] text-slate-500">{pageText.advancedMarketsDescription}</p><a href="/subscription" className="mt-3 inline-flex rounded-lg bg-violet-500 px-4 py-2 text-sm font-black text-white">{pageText.upgradeSubscription}</a></div>}
          </section>
        </div>

        <MatchIntelligence
          locale={locale}
          available={data.match_intelligence_available}
          data={data.match_intelligence}
        />

        <footer className="relative overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#030815] px-4 py-3 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 rounded-full bg-cyan-400/[0.06] blur-[60px]" />
          <div className="relative mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/[0.06]">
                <div className="absolute inset-1.5 rounded-full border border-dashed border-cyan-300/20" />
                <span className="relative text-sm font-black tracking-tight text-cyan-300">AI</span>
              </div>
              <div className="text-start">
                <strong className="block text-sm font-black tracking-[0.16em] text-cyan-300">MÅLX INTELLIGENCE</strong>
                <span className="mt-1 block text-[13px] font-semibold text-slate-600">{locale === "ar" ? "بصمة الذكاء الاصطناعي للتحليل" : locale === "sv" ? "AI-signatur för matchanalys" : "AI analysis signature"}</span>
              </div>
            </div>
            <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-sm font-black text-slate-500">{data.engine_version}</span>
          </div>
          <div className="relative mt-3 text-[13px] font-semibold tracking-[0.08em] text-slate-700">{data.api_version} — {data.engine_version}</div>
        </footer>
      </div>
    </main>
  );
}
