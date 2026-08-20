import type { ReactNode } from "react";

import LatestMatchHero from "@/components/prediction/LatestMatchHero";
import ConfidenceGauge from "@/components/prediction/ConfidenceGauge";
import ProScoreMatrix from "@/components/prediction/ProScoreMatrix";
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
  const [match, prediction] = await Promise.all([
    apiFetch<MatchDetailsResponse>(
      `/matches/${matchId}`,
    ),

    apiFetch<OfficialPredictionResponse>(
      `/predictions/${matchId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ),
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

    markets: {
      advanced_available:
        Object.keys(prediction.btts ?? {}).length > 0 ||
        Object.keys(prediction.totals ?? {}).length > 0 ||
        Object.keys(prediction.double_chance ?? {}).length > 0 ||
        Object.keys(prediction.draw_no_bet ?? {}).length > 0 ||
        Object.keys(prediction.clean_sheet ?? {}).length > 0 ||
        Object.keys(prediction.win_to_nil ?? {}).length > 0,
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
      differences: {},
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
  return (
    <div
      className={`rounded-3xl border p-6 ${
        active
          ? "border-violet-500/40 bg-violet-950/20"
          : "border-cyan-500/20 bg-slate-950/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-slate-200">{title}</p>
        {active && (
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
            {activeLabel}
          </span>
        )}
      </div>

      <p
        className={`mt-4 text-4xl font-black ${
          active ? "text-violet-300" : "text-cyan-300"
        }`}
      >
        {pct(value)}
      </p>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={
            active
              ? "h-full rounded-full bg-violet-400"
              : "h-full rounded-full bg-cyan-400"
          }
          style={{
            width: `${Math.min(Math.max(value, 0), 100)}%`,
          }}
        />
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
    <div className="rounded-3xl border border-slate-800 bg-[#071023] p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-4xl font-black text-cyan-300">
        {value}
      </p>
      {note && (
        <p className="mt-2 text-sm text-slate-500">{note}</p>
      )}
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
  const text =
    locale === "sv"
      ? {
          league: "Liga",
          season: "Säsong",
          round: "Omgång",
          stage: "Fas",
          venue: "Arena",
          city: "Stad",
          capacity: "Kapacitet",
          referee: "Domare",
          unavailable: "Inte tillgänglig",
          refereePending: "Domaren har inte utsetts ännu",
          matchCenter: "Matchcenter",
          matchInfo: "Matchinformation",
          stadium: "Arena",
          match: "matchen",
          leagueLogo: "Logotyp för",
        }
      : locale === "en"
        ? {
            league: "League",
            season: "Season",
            round: "Round",
            stage: "Stage",
            venue: "Venue",
            city: "City",
            capacity: "Capacity",
            referee: "Referee",
            unavailable: "Not available",
            refereePending: "Referee has not been assigned yet",
            matchCenter: "Match Center",
            matchInfo: "Match Information",
            stadium: "Stadium",
            match: "the match",
            leagueLogo: "Logo of",
          }
        : {
            league: "الدوري",
            season: "الموسم",
            round: "الجولة",
            stage: "المرحلة",
            venue: "الملعب",
            city: "المدينة",
            capacity: "سعة الملعب",
            referee: "الحكم",
            unavailable: "غير متوفر",
            refereePending: "لم يتم تعيين الحكم بعد",
            matchCenter: "مركز المباراة",
            matchInfo: "معلومات المباراة",
            stadium: "ملعب",
            match: "المباراة",
            leagueLogo: "شعار",
          };
  const details = [
    {
      label: text.league,
      value: league?.name ?? text.unavailable,
    },
    {
      label: text.season,
      value: season?.name ?? text.unavailable,
    },
    {
      label: text.round,
      value: round ?? text.unavailable,
    },
    {
      label: text.stage,
      value: stage ?? text.unavailable,
    },
    {
      label: text.venue,
      value: venue?.name ?? text.unavailable,
    },
    {
      label: text.city,
      value: venue?.city ?? text.unavailable,
    },
    {
      label: text.capacity,
      value: formatCapacity(venue?.capacity, locale),
    },
    {
      label: text.referee,
      value: referee?.name ?? text.refereePending,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-[#050b1e]">
      {venue?.image && (
        <div
          role="img"
          aria-label={`${text.stadium} ${venue.name ?? text.match}`}
          className="h-52 bg-cover bg-center sm:h-64"
          style={{
            backgroundImage:
              `linear-gradient(to top, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.15)), url("${venue.image}")`,
          }}
        />
      )}

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-400">
              {text.matchCenter}
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {text.matchInfo}
            </h2>
          </div>

          {league?.logo && (
            <div
              role="img"
              aria-label={`${text.leagueLogo} ${league.name ?? text.league}`}
              className="h-14 w-14 rounded-2xl bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: `url("${league.logo}")`,
              }}
            />
          )}
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {details.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
            >
              <p className="text-sm text-slate-500">
                {item.label}
              </p>

              <p className="mt-2 font-bold text-slate-100">
                {item.value}
              </p>
            </div>
          ))}
        </div>
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
    <section className="rounded-[32px] border border-violet-500/30 bg-gradient-to-l from-violet-950/30 to-slate-950 p-7 text-center sm:p-8">
      <div className="text-4xl">🔒</div>

      <h2 className="mt-4 text-2xl font-black text-white">
        {title}
      </h2>

      <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-400">
        {description}
      </p>

      <a
        href="/subscription"
        className="mt-6 inline-flex rounded-xl bg-violet-500 px-6 py-3 font-black text-white transition hover:bg-violet-400"
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
      throw new Error(
        earlyPageText.loginRequired,
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



  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] px-4 py-8 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
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
          <section className="rounded-[28px] border border-slate-800 bg-[#050b1e] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-cyan-400">
                        {pageText.quickOverview}
                      </p>
        
                      <h2 className="mt-1 text-lg font-black text-white">
                        {pageText.predictionSummary}
                      </h2>
                    </div>
        
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-400">
                      {pageText.preMatch}
                    </span>
                  </div>
        
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.045] p-4">
                      <p className="text-xs text-slate-500">
                        {pageText.totalExpectedGoals}
                      </p>
        
                      <strong className="mt-2 block text-2xl font-black text-cyan-300">
                        {Number(
                          xg.total_expected_goals ?? 0,
                        ).toFixed(2)}
                      </strong>
        
                      <span className="mt-1 block text-xs text-slate-600">
                        {pageText.goalUnit}
                      </span>
                    </div>
        
                    <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.045] p-4">
                      <p className="text-xs text-slate-500">
                        {pageText.expectedCorners}
                      </p>
        
                      <strong className="mt-2 block text-2xl font-black text-violet-300">
                        {cornersForecast?.total_expected != null
                          ? Number(
                              cornersForecast.total_expected,
                            ).toFixed(2)
                          : pageText.unavailable}
                      </strong>
        
                      <span className="mt-1 block text-xs text-slate-600">
                        {pageText.cornerUnit}
                      </span>
                    </div>
        
                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.045] p-4">
                      <p className="text-xs text-slate-500">
                        {pageText.expectedYellowCards}
                      </p>
        
                      <strong className="mt-2 block text-2xl font-black text-amber-300">
                        {yellowCardsForecast?.total_expected != null
                          ? Number(
                              yellowCardsForecast.total_expected,
                            ).toFixed(2)
                          : pageText.unavailable}
                      </strong>
        
                      <span className="mt-1 block text-xs text-slate-600">
                        {pageText.cardUnit}
                      </span>
                    </div>
        
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4">
                      <p className="text-xs text-slate-500">
                        {pageText.predictionConfidence}
                      </p>
        
                      <strong className="mt-2 block text-2xl font-black text-emerald-300">
                        {Number(
                          confidence.value ?? 0,
                        ).toFixed(0)}%
                      </strong>
        
                      <span className="mt-1 block text-xs text-slate-600">
                        {pageText.engineConfidenceLevel}
                      </span>
                    </div>
                  </div>
                </section>
        
                <section>
                  <h2 className="mb-5 text-2xl font-black">
                    {pageText.matchResultProbabilities}
                  </h2>
        
                  <div className="grid gap-5 md:grid-cols-3">
                    <ProgressCard
                      title={pageText.homeWin(home.name)}
                      value={result.home_win}
                      active={result.home_win === highest}
                      activeLabel={pageText.highest}
                    />
                    <ProgressCard
                      title={pageText.draw}
                      value={result.draw}
                      active={result.draw === highest}
                      activeLabel={pageText.highest}
                    />
                    <ProgressCard
                      title={pageText.awayWin(away.name)}
                      value={result.away_win}
                      active={result.away_win === highest}
                      activeLabel={pageText.highest}
                    />
                  </div>
                </section>
        
                <section className="grid gap-5 lg:grid-cols-3">
                  <StatCard
                    title={pageText.bestPrediction}
                    value={formatOutcome(
                      data.prediction.predicted_outcome,
                      home.name,
                      away.name,
                      locale,
                    )}
                    note={`${pageText.highestProbability}: ${pct(confidence.highest_probability)}`}
                  />
        
                  <ConfidenceGauge
                    value={confidence.value}
                    level={confidence.level}
                    model={data.analysis.confidence_model}
                  />
        
                  <StatCard
                    title={pageText.totalExpectedGoals}
                    value={Number(xg.total_expected_goals ?? 0).toFixed(2)}
                    note={`${pageText.probabilityMargin}: ${Number(confidence.probability_margin ?? 0).toFixed(2)}`}
                  />
                </section>
        
                <section className="rounded-[32px] border border-cyan-500/25 bg-gradient-to-l from-cyan-950/20 to-violet-950/20 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black">
                        {pageText.exactScoreReading}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {pageText.exactScoreDescription}
                      </p>
                    </div>
        
                    <span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs text-slate-400">
                      {pageText.scoreDistribution}
                    </span>
                  </div>
        
                  <div className="mt-7 grid gap-5 md:grid-cols-2">
                    <div className="rounded-3xl border border-violet-500/25 bg-violet-950/15 p-6">
                      <p className="text-sm font-bold text-slate-400">
                        {pageText.highestSingleScore}
                      </p>
        
                      <p dir="ltr" className="mt-3 text-5xl font-black text-violet-300">
                        {data.prediction.most_likely_score.score}
                      </p>
        
                      <p className="mt-3 text-sm text-slate-400">
                        {pageText.probability}{" "}
                        <strong className="text-violet-300">
                          {pct(
                            data.prediction.most_likely_score.probability,
                          )}
                        </strong>
                      </p>
                    </div>
        
                    <div className="rounded-3xl border border-emerald-500/25 bg-emerald-950/15 p-6">
                      <p className="text-sm font-bold text-slate-400">
                        {pageText.winnerConsistentScore}
                      </p>
        
                      <p dir="ltr" className="mt-3 text-5xl font-black text-emerald-300">
                        {data.prediction.recommended_score.score}
                      </p>
        
                      <p className="mt-3 text-sm text-slate-400">
                        {pageText.probability}{" "}
                        <strong className="text-emerald-300">
                          {pct(
                            data.prediction.recommended_score.probability,
                          )}
                        </strong>
                      </p>
                    </div>
                  </div>
        
                  {data.prediction.score_distribution &&
                  !data.prediction.score_distribution.outcome_consistency
                    .top_score_matches_prediction ? (
                    <p className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 text-sm leading-6 text-amber-100/80">
                      {pageText.scoreMismatch}


                    </p>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-sm leading-6 text-emerald-100/80">
                      {pageText.scoreConsistent}
                    </p>
                  )}
                </section>
        
                <section>
                  <h2 className="mb-5 text-2xl font-black">
                    {pageText.topPredictionMarkets}
                  </h2>
        
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {data.markets.advanced_available ? (
                      marketCards.map(([title, value]) => (
                        <ProgressCard
                          key={title}
                          title={title}
                          value={value}
                        />
                      ))
                    ) : (
                      <div className="sm:col-span-2 lg:col-span-3 rounded-[28px] border border-violet-500/30 bg-gradient-to-l from-violet-950/30 to-slate-950 p-7 text-center">
                        <div className="text-4xl">
                          🔒
                        </div>
        
                        <h3 className="mt-4 text-2xl font-black text-white">
                          {pageText.advancedMarketsPro}
                        </h3>
        
                        <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-400">
                          {pageText.advancedMarketsDescription}

                        </p>
        
                        <a
                          href="/subscription"
                          className="mt-6 inline-flex rounded-xl bg-violet-500 px-6 py-3 font-black text-white transition hover:bg-violet-400"
                        >
                          {pageText.upgradeSubscription}
                        </a>
                      </div>
                    )}
                  </div>
                </section>
        
                <ProLockedSection
                  available={data.markets.advanced_available}
                  upgradeLabel={pageText.upgradeSubscription}
                  title={pageText.matchEventsPro}
                  description={pageText.matchEventsProDescription}
                >
                <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black">
                        {pageText.matchEventsForecast}
                      </h2>
        
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {pageText.matchEventsDescription}

                      </p>
                    </div>
        
                    <span className="rounded-full border border-cyan-500/25 bg-cyan-950/20 px-3 py-1 text-xs font-bold text-cyan-300">
                      {pageText.matchEventsForecast}
                    </span>
                  </div>
        
                  <div className="mt-7 grid gap-6 xl:grid-cols-2">
                    <article className="rounded-3xl border border-cyan-500/25 bg-cyan-950/10 p-5">
                      <h3 className="text-xl font-black text-cyan-300">
                        {pageText.expectedCorners}
                      </h3>
        
                      {cornersExplanation && (
                        <details className="mt-4 rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-4">
                          <summary className="cursor-pointer font-bold text-cyan-300">
                            {pageText.howCornersCalculated}
                          </summary>
        
                          <div className="mt-4 space-y-2 text-sm text-slate-300">
                            <p>
                              <strong>{pageText.calculationMethod}</strong>{" "}
                              {cornersExplanation.method}
                            </p>
        
                            <p>
                              <strong>{pageText.statisticalDistribution}</strong>{" "}
                              {cornersExplanation.distribution}
                            </p>
        
                            <p className="break-words">
                              <strong>{pageText.formula}</strong>{" "}
                              {cornersExplanation.formula}
                            </p>
                          </div>
                        </details>
                      )}
        
                      {cornersForecast ? (
                        <>
                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <StatCard
                              title={home.name}
                              value={
                                cornersForecast.home_expected.toFixed(2)
                              }
                              note={pageText.expectedCornersNote}
                            />
        
                            <StatCard
                              title={away.name}
                              value={
                                cornersForecast.away_expected.toFixed(2)
                              }
                              note={pageText.expectedCornersNote}
                            />
        
                            <StatCard
                              title={pageText.matchTotal}
                              value={
                                cornersForecast.total_expected.toFixed(2)
                              }
                              note={
                                cornersForecast.most_likely_range
                                  ? `${pageText.likelyRange}: ${cornersForecast.most_likely_range.minimum} - ${cornersForecast.most_likely_range.maximum}`
                                  : pageText.expectedTotal
                              }
                            />
                          </div>
        
                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {cornerLines.map(([key, value]) => (
                              <ProgressCard
                                key={key}
                                title={`${marketLineLabel(key)} ${pageText.cornerUnit}`}
                                value={Number(value)}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 text-sm text-amber-100/80">
                          {pageText.cornersUnavailable}
                        </p>
                      )}
                    </article>
        
                    <article className="rounded-3xl border border-amber-500/25 bg-amber-950/10 p-5">
                      <h3 className="text-xl font-black text-amber-300">
                        {pageText.expectedYellowCards}
                      </h3>
        
                      {yellowCardsExplanation && (
                        <details className="mt-4 rounded-2xl border border-amber-500/20 bg-slate-900/40 p-4">
                          <summary className="cursor-pointer font-bold text-amber-300">
                            {pageText.howCardsCalculated}
                          </summary>
        
                          <div className="mt-4 space-y-2 text-sm text-slate-300">
                            <p>
                              <strong>{pageText.calculationMethod}</strong>{" "}
                              {yellowCardsExplanation.method}
                            </p>
        
                            <p>
                              <strong>{pageText.statisticalDistribution}</strong>{" "}
                              {yellowCardsExplanation.distribution}
                            </p>
        
                            <p className="break-words">
                              <strong>{pageText.formula}</strong>{" "}
                              {yellowCardsExplanation.formula}
                            </p>
                          </div>
                        </details>
                      )}
        
                      {yellowCardsForecast ? (
                        <>
                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <StatCard
                              title={home.name}
                              value={
                                yellowCardsForecast.home_expected.toFixed(2)
                              }
                              note={pageText.expectedCardsNote}
                            />
        
                            <StatCard
                              title={away.name}
                              value={
                                yellowCardsForecast.away_expected.toFixed(2)
                              }
                              note={pageText.expectedCardsNote}
                            />
        
                            <StatCard
                              title={pageText.matchTotal}
                              value={
                                yellowCardsForecast.total_expected.toFixed(2)
                              }
                              note={
                                yellowCardsForecast.most_likely_range
                                  ? `${pageText.likelyRange}: ${yellowCardsForecast.most_likely_range.minimum} - ${yellowCardsForecast.most_likely_range.maximum}`
                                  : pageText.expectedTotal
                              }
                            />
                          </div>
        
                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {yellowCardLines.map(([key, value]) => (
                              <ProgressCard
                                key={key}
                                title={`${marketLineLabel(key)} ${pageText.cardUnit}`}
                                value={Number(value)}
                              />
                            ))}
                          </div>
        
                          <p className="mt-4 text-xs text-slate-500">
                            {yellowCardsForecast.referee_adjusted
                              ? pageText.refereeAdjusted
                              : pageText.refereeNotAdjusted}
                          </p>
                        </>
                      ) : (
                        <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 text-sm text-amber-100/80">
                          {pageText.cardsUnavailable}
                        </p>
                      )}
                    </article>
                  </div>
                </section>
                </ProLockedSection>

              <ProLockedSection
                available={data.markets.advanced_available}
                upgradeLabel={pageText.upgradeSubscription}
                title={pageText.teamComparisonPro}
                description={pageText.teamComparisonProDescription}
              >
              <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
                <h2 className="text-2xl font-black">
                  {pageText.teamComparison}
                </h2>
      
                <div className="mt-7 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-center">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="p-4">{home.name}</th>
                        <th className="p-4">{pageText.metric}</th>
                        <th className="p-4">{away.name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisons.map(([label, homeValue, awayValue]) => (
                        <tr
                          key={label}
                          className="border-b border-slate-900"
                        >
                          <td className="p-4 font-bold text-cyan-300">
                            {Number(homeValue ?? 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-slate-300">
                            {label}
                          </td>
                          <td className="p-4 font-bold text-violet-300">
                            {Number(awayValue ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              </ProLockedSection>

            <MatchInfoCard
              league={data.league}
              season={data.season}
              round={data.round}
              stage={data.stage}
              venue={data.venue}
              referee={data.referee}
              locale={locale}
            />
    
            <ProScoreMatrix
              matchId={matchId}
              mostLikelyScore={
                data.prediction.most_likely_score.score
              }
              recommendedScore={
                data.prediction.recommended_score.score
              }
              homeWin={data.markets.match_result.home_win}
              draw={data.markets.match_result.draw}
              awayWin={data.markets.match_result.away_win}
            />
    
            <ProLockedSection
              available={data.markets.advanced_available}
              upgradeLabel={pageText.upgradeSubscription}
              title={pageText.topScoresPro}
              description={pageText.topScoresProDescription}
            >
              <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
                <h2 className="text-2xl font-black">
                  {pageText.topScores}
                </h2>

                <div className="mt-7 grid gap-4 md:grid-cols-2">
                  {data.markets.top_scores.slice(0, 10).map(
                    (score, index) => (
                      <div
                        key={`${score.score}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 font-black text-cyan-300">
                            {index + 1}
                          </span>

                          <strong className="text-2xl">
                            {score.score}
                          </strong>
                        </div>

                        <span className="font-bold text-cyan-300">
                          {pct(score.probability)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </ProLockedSection>

          <section className="rounded-[32px] border border-cyan-500/25 bg-gradient-to-l from-cyan-950/20 to-violet-950/20 p-6 sm:p-8">
            <h2 className="text-2xl font-black">
              {pageText.modelAlerts}
            </h2>
  
            {data.analysis.warnings.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {data.analysis.warnings.map((warning, index) => (
                  <li
                    key={`${warning}-${index}`}
                    className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-4 text-slate-300"
                  >
                    {translateModelWarning(warning, locale)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-slate-400">
                {pageText.noWarnings}
              </p>
            )}
          </section>
  
          <ProLockedSection
            available={data.markets.advanced_available}
            upgradeLabel={pageText.upgradeSubscription}
            title={pageText.confidenceFactorsPro}
            description={pageText.confidenceFactorsProDescription}
          >
            <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
              <h2 className="text-2xl font-black">
                {pageText.confidenceFactors}
              </h2>

              <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  data.analysis.confidence_factors,
                ).map(([key, value]) => (
                  <ProgressCard
                    key={key}
                    title={factorLabels[key] ?? key}
                    value={value}
                  />
                ))}
              </div>
            </section>
          </ProLockedSection>

        <footer className="pb-5 text-center text-sm text-slate-600">
          {data.api_version} — {data.engine_version}
        </footer>
      </div>
    </main>
  );
}









































































