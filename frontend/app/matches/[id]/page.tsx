import LatestMatchHero from "@/components/prediction/LatestMatchHero";
import ConfidenceGauge from "@/components/prediction/ConfidenceGauge";
import ProScoreMatrix from "@/components/prediction/ProScoreMatrix";
import { apiFetch } from "@/lib/api";

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
    corners: number | null;
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
): Promise<LatestPredictionResponse> {
  const [match, prediction] = await Promise.all([
    apiFetch<MatchDetailsResponse>(
      `/matches/${matchId}`,
    ),

    apiFetch<OfficialPredictionResponse>(
      `/predictions/${matchId}`,
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
        "الفريق المضيف",

      away_team:
        match.away_team ??
        predictionAway.name ??
        "الفريق الضيف",

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
          "Home Team",
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
          "Away Team",
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


function outcomeArabic(
  outcome: string,
  home: string,
  away: string,
) {
  if (outcome === "home_win") return `فوز ${home}`;
  if (outcome === "away_win") return `فوز ${away}`;
  return "التعادل";
}

function formatDate(date: string | null) {
  if (!date) return "موعد المباراة غير متوفر";

  const parsed = new Date(
    date.includes("T") ? date : date.replace(" ", "T"),
  );

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

function formatCapacity(
  capacity: number | null | undefined,
) {
  if (!capacity || capacity <= 0) {
    return "غير متوفرة";
  }

  return new Intl.NumberFormat("ar-IQ").format(capacity);
}

function ProgressCard({
  title,
  value,
  active = false,
}: {
  title: string;
  value: number;
  active?: boolean;
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
            الأعلى
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
}: {
  league?: LeagueInfo | null;
  season?: SeasonInfo | null;
  round?: string | null;
  stage?: string | null;
  venue?: VenueInfo | null;
  referee?: RefereeInfo | null;
}) {
  const details = [
    {
      label: "الدوري",
      value: league?.name ?? "غير متوفر",
    },
    {
      label: "الموسم",
      value: season?.name ?? "غير متوفر",
    },
    {
      label: "الجولة",
      value: round ?? "غير متوفرة",
    },
    {
      label: "المرحلة",
      value: stage ?? "غير متوفرة",
    },
    {
      label: "الملعب",
      value: venue?.name ?? "غير متوفر",
    },
    {
      label: "المدينة",
      value: venue?.city ?? "غير متوفرة",
    },
    {
      label: "سعة الملعب",
      value: formatCapacity(venue?.capacity),
    },
    {
      label: "الحكم",
      value:
        referee?.name ??
        "لم يتم تعيين الحكم بعد",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-[#050b1e]">
      {venue?.image && (
        <div
          role="img"
          aria-label={`ملعب ${venue.name ?? "المباراة"}`}
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
              مركز المباراة
            </p>

            <h2 className="mt-1 text-2xl font-black">
              معلومات المباراة
            </h2>
          </div>

          {league?.logo && (
            <div
              role="img"
              aria-label={`شعار ${league.name ?? "الدوري"}`}
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

const factorLabels: Record<string, string> = {
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

export default async function MatchPage({
  params,
}: PageProps) {
  const { id } = await params;
  const matchId = Number(id);

  if (!Number.isInteger(matchId) || matchId <= 0) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#020617] p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/30 bg-red-950/20 p-8">
          <h1 className="text-2xl font-black">
            رقم المباراة غير صالح
          </h1>
        </div>
      </main>
    );
  }

  let data: LatestPredictionResponse;

  try {
    data = await getPrediction(matchId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير معروف";

    return (
      <main dir="rtl" className="min-h-screen bg-[#020617] p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/30 bg-red-950/20 p-8">
          <h1 className="text-2xl font-black">
            تعذر تحميل تحليل المباراة
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
      `تعذر تحديد معرفي الفريقين للمباراة رقم ${matchId}`,
    );
  }

  const [homeTeamStatistics, awayTeamStatistics] =
    await Promise.all([
      apiFetch<TeamStatisticsResponse>(
        `/teams/${homeTeamId}/statistics?limit=10`,
      ),
      apiFetch<TeamStatisticsResponse>(
        `/teams/${awayTeamId}/statistics?limit=10`,
      ),
    ]);

  const home: Team = {

    id: homeTeamId,

    name:
      data.match.home_team ??
      homeTeamStatistics.team_name ??
      "Home Team",

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

    corners:
      homeTeamStatistics.match_averages.corners ?? undefined,

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
      "Away Team",

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

    corners:
      awayTeamStatistics.match_averages.corners ?? undefined,

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

  const marketLineLabel = (
    key: string,
  ): string =>
    key
      .replace("over_", "أكثر من ")
      .replaceAll("_", ".");

  const marketCards = [
    ["تسجيل الفريقين", data.markets.btts.yes, `لا: ${pct(data.markets.btts.no)}`],
    ["المضيف أو التعادل 1X", data.markets.double_chance.home_or_draw_1x, ""],
    ["الضيف أو التعادل X2", data.markets.double_chance.draw_or_away_x2, ""],
    ["لا تعادل 12", data.markets.double_chance.home_or_away_12, ""],
    ["تعادل لا رهان — المضيف", data.markets.draw_no_bet.home, ""],
    ["تعادل لا رهان — الضيف", data.markets.draw_no_bet.away, ""],
    ["أكثر من 1.5 هدف", totals15?.over ?? 0, ""],
    ["أكثر من 2.5 هدف", totals25?.over ?? 0, ""],
    ["أقل من 2.5 هدف", totals25?.under ?? 0, ""],
    ["أقل من 3.5 هدف", totals35?.under ?? 0, ""],
    ["فوز المضيف دون استقبال", data.markets.win_to_nil.home, ""],
    ["فوز الضيف دون استقبال", data.markets.win_to_nil.away, ""],
  ] as const;

  const comparisons = [
    ["Elo", home.elo, away.elo],
    ["الهجوم", home.attack, away.attack],
    ["الدفاع", home.defense, away.defense],
    ["الفورمة", home.form_rating, away.form_rating],
    ["الأهداف المسجلة", home.goals_scored, away.goals_scored],
    ["الأهداف المستقبلة", home.goals_conceded, away.goals_conceded],
    ["الاستحواذ", home.possession, away.possession],
    ["التسديدات", home.shots, away.shots],
    [
      "التسديدات على المرمى",
      home.shots_on_target,
      away.shots_on_target,
    ],
    ["الركنيات", home.corners, away.corners],
    ["الأخطاء", home.fouls, away.fouls],
    [
      "البطاقات الصفراء",
      home.yellow_cards,
      away.yellow_cards,
    ],
    ["النقاط", home.points, away.points],
    ["فارق الأهداف", home.goal_difference, away.goal_difference],
  ] as const;

  return (
    <main
      dir="rtl"
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
          engineVersion={data.engine_version}
          matchDate={formatDate(data.match.date)}
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
                نظرة سريعة
              </p>

              <h2 className="mt-1 text-lg font-black text-white">
                ملخص توقعات المباراة
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-400">
              قبل المباراة
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.045] p-4">
              <p className="text-xs text-slate-500">
                إجمالي الأهداف المتوقعة
              </p>

              <strong className="mt-2 block text-2xl font-black text-cyan-300">
                {Number(
                  xg.total_expected_goals ?? 0,
                ).toFixed(2)}
              </strong>

              <span className="mt-1 block text-xs text-slate-600">
                هدف
              </span>
            </div>

            <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.045] p-4">
              <p className="text-xs text-slate-500">
                الركنيات المتوقعة
              </p>

              <strong className="mt-2 block text-2xl font-black text-violet-300">
                {cornersForecast?.total_expected != null
                  ? Number(
                      cornersForecast.total_expected,
                    ).toFixed(2)
                  : "غير متوفر"}
              </strong>

              <span className="mt-1 block text-xs text-slate-600">
                ركنية
              </span>
            </div>

            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.045] p-4">
              <p className="text-xs text-slate-500">
                البطاقات الصفراء المتوقعة
              </p>

              <strong className="mt-2 block text-2xl font-black text-amber-300">
                {yellowCardsForecast?.total_expected != null
                  ? Number(
                      yellowCardsForecast.total_expected,
                    ).toFixed(2)
                  : "غير متوفر"}
              </strong>

              <span className="mt-1 block text-xs text-slate-600">
                بطاقة
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4">
              <p className="text-xs text-slate-500">
                ثقة التوقع
              </p>

              <strong className="mt-2 block text-2xl font-black text-emerald-300">
                {Number(
                  confidence.value ?? 0,
                ).toFixed(0)}%
              </strong>

              <span className="mt-1 block text-xs text-slate-600">
                مستوى ثقة المحرك
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-black">
            احتمالات نتيجة المباراة
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            <ProgressCard
              title={`فوز ${home.name}`}
              value={result.home_win}
              active={result.home_win === highest}
            />
            <ProgressCard
              title="التعادل"
              value={result.draw}
              active={result.draw === highest}
            />
            <ProgressCard
              title={`فوز ${away.name}`}
              value={result.away_win}
              active={result.away_win === highest}
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <StatCard
            title="أفضل توقع"
            value={outcomeArabic(
              data.prediction.predicted_outcome,
              home.name,
              away.name,
            )}
            note={`أعلى احتمال: ${pct(confidence.highest_probability)}`}
          />

          <ConfidenceGauge
            value={confidence.value}
            level={confidence.level}
            model={data.analysis.confidence_model}
          />

          <StatCard
            title="إجمالي الأهداف المتوقعة"
            value={Number(xg.total_expected_goals ?? 0).toFixed(2)}
            note={`هامش الاحتمالات: ${Number(confidence.probability_margin ?? 0).toFixed(2)}`}
          />
        </section>

        <section className="rounded-[32px] border border-cyan-500/25 bg-gradient-to-l from-cyan-950/20 to-violet-950/20 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">
                قراءة النتيجة الدقيقة
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                مقارنة بين أعلى نتيجة منفردة والنتيجة الأكثر اتساقًا مع توقع الفائز.
              </p>
            </div>

            <span className="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1 text-xs text-slate-400">
              Score Distribution
            </span>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-violet-500/25 bg-violet-950/15 p-6">
              <p className="text-sm font-bold text-slate-400">
                أعلى نتيجة منفردة
              </p>

              <p dir="ltr" className="mt-3 text-5xl font-black text-violet-300">
                {data.prediction.most_likely_score.score}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                الاحتمال{" "}
                <strong className="text-violet-300">
                  {pct(
                    data.prediction.most_likely_score.probability,
                  )}
                </strong>
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-950/15 p-6">
              <p className="text-sm font-bold text-slate-400">
                النتيجة المتوافقة مع توقع الفائز
              </p>

              <p dir="ltr" className="mt-3 text-5xl font-black text-emerald-300">
                {data.prediction.recommended_score.score}
              </p>

              <p className="mt-3 text-sm text-slate-400">
                الاحتمال{" "}
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
              أعلى نتيجة منفردة لا تطابق فئة النتيجة الأقوى في احتمالات
              المباراة. لذلك يعرض النموذج نتيجة ثانية أكثر اتساقًا مع
              توقع الفائز، من دون تغيير الاحتمالات الأصلية.
            </p>
          ) : (
            <p className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-sm leading-6 text-emerald-100/80">
              النتيجة الدقيقة الأعلى متوافقة مع توقع الفائز.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-black">
            أهم أسواق التوقع
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {marketCards.map(([title, value, note]) => (
              <ProgressCard
                key={title}
                title={title}
                value={value}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">
                توقع أحداث المباراة
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                توقعات المباراة الفعلية، وليست مجرد متوسطات الفرق
                التاريخية.
              </p>
            </div>

            <span className="rounded-full border border-cyan-500/25 bg-cyan-950/20 px-3 py-1 text-xs font-bold text-cyan-300">
              Match Events Forecast
            </span>
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-cyan-500/25 bg-cyan-950/10 p-5">
              <h3 className="text-xl font-black text-cyan-300">
                الركنيات المتوقعة
              </h3>

              {cornersExplanation && (
                <details className="mt-4 rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-4">
                  <summary className="cursor-pointer font-bold text-cyan-300">
                    كيف تم حساب توقع الركنيات؟
                  </summary>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>
                      <strong>طريقة الحساب:</strong>{" "}
                      {cornersExplanation.method}
                    </p>

                    <p>
                      <strong>التوزيع الإحصائي:</strong>{" "}
                      {cornersExplanation.distribution}
                    </p>

                    <p className="break-words">
                      <strong>المعادلة:</strong>{" "}
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
                      note="ركنيات متوقعة"
                    />

                    <StatCard
                      title={away.name}
                      value={
                        cornersForecast.away_expected.toFixed(2)
                      }
                      note="ركنيات متوقعة"
                    />

                    <StatCard
                      title="إجمالي المباراة"
                      value={
                        cornersForecast.total_expected.toFixed(2)
                      }
                      note={
                        cornersForecast.most_likely_range
                          ? `النطاق المرجح: ${cornersForecast.most_likely_range.minimum} - ${cornersForecast.most_likely_range.maximum}`
                          : "الإجمالي المتوقع"
                      }
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {cornerLines.map(([key, value]) => (
                      <ProgressCard
                        key={key}
                        title={`${marketLineLabel(key)} ركنية`}
                        value={Number(value)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 text-sm text-amber-100/80">
                  توقع الركنيات غير متاح لهذه المباراة.
                </p>
              )}
            </article>

            <article className="rounded-3xl border border-amber-500/25 bg-amber-950/10 p-5">
              <h3 className="text-xl font-black text-amber-300">
                البطاقات الصفراء المتوقعة
              </h3>

              {yellowCardsExplanation && (
                <details className="mt-4 rounded-2xl border border-amber-500/20 bg-slate-900/40 p-4">
                  <summary className="cursor-pointer font-bold text-amber-300">
                    كيف تم حساب توقع البطاقات؟
                  </summary>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>
                      <strong>طريقة الحساب:</strong>{" "}
                      {yellowCardsExplanation.method}
                    </p>

                    <p>
                      <strong>التوزيع الإحصائي:</strong>{" "}
                      {yellowCardsExplanation.distribution}
                    </p>

                    <p className="break-words">
                      <strong>المعادلة:</strong>{" "}
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
                      note="بطاقات متوقعة"
                    />

                    <StatCard
                      title={away.name}
                      value={
                        yellowCardsForecast.away_expected.toFixed(2)
                      }
                      note="بطاقات متوقعة"
                    />

                    <StatCard
                      title="إجمالي المباراة"
                      value={
                        yellowCardsForecast.total_expected.toFixed(2)
                      }
                      note={
                        yellowCardsForecast.most_likely_range
                          ? `النطاق المرجح: ${yellowCardsForecast.most_likely_range.minimum} - ${yellowCardsForecast.most_likely_range.maximum}`
                          : "الإجمالي المتوقع"
                      }
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {yellowCardLines.map(([key, value]) => (
                      <ProgressCard
                        key={key}
                        title={`${marketLineLabel(key)} بطاقة`}
                        value={Number(value)}
                      />
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    {yellowCardsForecast.referee_adjusted
                      ? "تم تطبيق تأثير الحكم على التوقع."
                      : "لم يُطبق تأثير حكم مخصص على التوقع."}
                  </p>
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 text-sm text-amber-100/80">
                  توقع البطاقات غير متاح لهذه المباراة.
                </p>
              )}
            </article>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
          <h2 className="text-2xl font-black">
            مقارنة الفريقين
          </h2>

          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[650px] text-center">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="p-4">{home.name}</th>
                  <th className="p-4">المؤشر</th>
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

        <MatchInfoCard
          league={data.league}
          season={data.season}
          round={data.round}
          stage={data.stage}
          venue={data.venue}
          referee={data.referee}
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

        <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
          <h2 className="text-2xl font-black">
            النتائج الأكثر احتمالًا
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

        <section className="rounded-[32px] border border-cyan-500/25 bg-gradient-to-l from-cyan-950/20 to-violet-950/20 p-6 sm:p-8">
          <h2 className="text-2xl font-black">
            تنبيهات وتحليل النموذج
          </h2>

          {data.analysis.warnings.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {data.analysis.warnings.map((warning, index) => (
                <li
                  key={`${warning}-${index}`}
                  className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-4 text-slate-300"
                >
                  {warning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-slate-400">
              لا توجد تحذيرات.
            </p>
          )}
        </section>

        <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
          <h2 className="text-2xl font-black">
            عوامل الثقة
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

        <footer className="pb-5 text-center text-sm text-slate-600">
          {data.api_version} — {data.engine_version}
        </footer>
      </div>
    </main>
  );
}
















