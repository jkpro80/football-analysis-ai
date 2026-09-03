"use client";

import { useLocale } from "@/context/locale-context";

type HeroTeam = {
  id: number;
  sportmonks_id?: number;
  name: string;
  country?: string;
  logo?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
  [key: string]: unknown;
};

type MatchInfo = {
  id: number;
  date: string;
  status: string;
  home_score?: number | null;
  away_score?: number | null;
  is_finished?: boolean;
  actual_outcome?: string | null;
  league?: string | null;
  venue?: string | null;
};

type PredictionEvaluation = {
  available: boolean;

  winner_correct?: boolean | null;
  exact_score_correct?: boolean | null;

  predicted_outcome?: string | null;
  actual_outcome?: string | null;

  predicted_score?: {
    score?: string | null;
  } | null;

  btts?: {
    predicted?: boolean | null;
    actual?: boolean | null;
    correct?: boolean | null;
  } | null;

  over_2_5?: {
    predicted?: boolean | null;
    actual?: boolean | null;
    correct?: boolean | null;
  } | null;

  corners?: {
    available?: boolean | null;
    line?: number | null;
    predicted?: "over" | "under" | string | null;
    probability?: number | null;
    over_probability?: number | null;
    under_probability?: number | null;
    expected_min?: number | null;
    expected_max?: number | null;
    actual_total?: number | null;
    correct?: boolean | null;
  } | null;

  yellow_cards?: {
    available?: boolean | null;
    line?: number | null;
    predicted?: "over" | "under" | string | null;
    probability?: number | null;
    over_probability?: number | null;
    under_probability?: number | null;
    expected_min?: number | null;
    expected_max?: number | null;
    actual_total?: number | null;
    correct?: boolean | null;
  } | null;

  correct_checks?: number | null;
  total_checks?: number | null;
  accuracy_percentage?: number | null;

  [key: string]: unknown;
};

type MatchHeroProps = {
  match: MatchInfo;
  homeTeam: HeroTeam;
  awayTeam: HeroTeam;
  expectedGoals: {
    home: number;
    away: number;
    total: number;
  };
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  mostLikelyScore: {
    score: string;
    probability: number;
  };
  evaluation?: PredictionEvaluation;
};

const TEXT = {
  ar: {
    prediction: "النتيجة الأكثر احتمالًا",
    aiPrediction: "توقع الذكاء الاصطناعي",
    win: "فوز",
    draw: "تعادل",
    homeTeam: "صاحب الأرض",
    awayTeam: "الفريق الضيف",
    expectedXg: "المتوقع xG",
    totalXg: "إجمالي xG",
    scoreProbability: "احتمال النتيجة",
    strongPrediction: "توقع قوي",
    mediumPrediction: "توقع متوسط",
    lowPrediction: "توقع منخفض",
    highestProbability: "أعلى احتمال",
    predictionProbability: "احتمال التوقع",
    highest: "الأعلى",
    difference: "الفارق",
    predictionDirection: "اتجاه التوقع",
    directionNote: "أعلى احتمال منفرد قبل انطلاق المباراة.",
    predictionSummary: "ملخص التوقع",
    predictionQuality: "جودة التوقع",
    pending: "قيد الانتظار",
    qualityNote: "تقاس الجودة بعد انتهاء المباراة اعتمادًا على الأسواق الستة الرسمية.",
    fixture: "المباراة",
    venue: "الملعب",
    actualScore: "النتيجة الفعلية",
    predictionCorrect: "توقع الفائز صحيح",
    predictionWrong: "توقع الفائز غير صحيح",
    resultComparison: "مقارنة النتيجة",
    predictedVsActual: "المتوقع مقابل الفعلي",
    predictedScore: "النتيجة المتوقعة",
    predictionEvaluation: "تقييم التوقعات",
    enginePerformance: "دقة التوقعات في هذه المباراة",
    correct: "صحيح",
    incorrect: "غير صحيح",
    predicted: "المتوقع",
    actual: "الفعلي",
    matchAccuracy: "دقة هذه المباراة",
    accuracySummary: (correct: number, total: number) =>
      `نجح ${correct} من ${total} أسواق متاحة`,
    matchDirection: "اتجاه المباراة",
    exactScore: "النتيجة الدقيقة",
    bttsPrediction: "توقع تسجيل الفريقين",
    overUnder25: "أكثر/أقل من 2.5",
    cornersEvaluation: "الركنيات",
    yellowCardsEvaluation: "البطاقات الصفراء",
    yes: "نعم",
    no: "لا",
    over25: "أكثر من 2.5",
    under25: "أقل من 2.5",
    unavailable: "غير متوفر",
  },
  en: {
    prediction: "Most Likely Score",
    aiPrediction: "AI Prediction",
    win: "Win",
    draw: "Draw",
    homeTeam: "Home",
    awayTeam: "Away",
    expectedXg: "Expected xG",
    totalXg: "Total xG",
    scoreProbability: "Score Probability",
    strongPrediction: "Strong Prediction",
    mediumPrediction: "Medium Prediction",
    lowPrediction: "Low Prediction",
    highestProbability: "Highest Probability",
    predictionProbability: "Prediction Probability",
    highest: "Highest",
    difference: "Difference",
    predictionDirection: "Prediction Direction",
    directionNote: "Highest single probability before kickoff.",
    predictionSummary: "Prediction Summary",
    predictionQuality: "Prediction Quality",
    pending: "Pending",
    qualityNote: "Quality is measured after the match using the six official evaluation markets.",
    fixture: "Match",
    venue: "Venue",
    actualScore: "Actual Score",
    predictionCorrect: "Winner Prediction Correct",
    predictionWrong: "Winner Prediction Incorrect",
    resultComparison: "Result Comparison",
    predictedVsActual: "Predicted vs Actual",
    predictedScore: "Predicted Score",
    predictionEvaluation: "Prediction Evaluation",
    enginePerformance: "Prediction Accuracy in This Match",
    correct: "Correct",
    incorrect: "Incorrect",
    predicted: "Predicted",
    actual: "Actual",
    matchAccuracy: "Match Accuracy",
    accuracySummary: (correct: number, total: number) =>
      `${correct} of ${total} available markets were correct`,
    matchDirection: "Match Direction",
    exactScore: "Exact Score",
    bttsPrediction: "Both Teams to Score",
    overUnder25: "Over/Under 2.5",
    cornersEvaluation: "Corners",
    yellowCardsEvaluation: "Yellow Cards",
    yes: "Yes",
    no: "No",
    over25: "Over 2.5",
    under25: "Under 2.5",
    unavailable: "Unavailable",
  },
  sv: {
    prediction: "Troligaste resultat",
    aiPrediction: "AI-prognos",
    win: "Vinst",
    draw: "Oavgjort",
    homeTeam: "Hemma",
    awayTeam: "Borta",
    expectedXg: "Förväntat xG",
    totalXg: "Totalt xG",
    scoreProbability: "Resultatsannolikhet",
    strongPrediction: "Stark prognos",
    mediumPrediction: "Medelstark prognos",
    lowPrediction: "Svag prognos",
    highestProbability: "Högsta sannolikhet",
    predictionProbability: "Prognossannolikhet",
    highest: "Högst",
    difference: "Skillnad",
    predictionDirection: "Prognosriktning",
    directionNote: "Högsta enskilda sannolikhet före avspark.",
    predictionSummary: "Prognossammanfattning",
    predictionQuality: "Prognoskvalitet",
    pending: "Väntar",
    qualityNote: "Kvaliteten mäts efter matchen utifrån de sex officiella utvärderingsmarknaderna.",
    fixture: "Match",
    venue: "Arena",
    actualScore: "Slutresultat",
    predictionCorrect: "Vinnartipset rätt",
    predictionWrong: "Vinnartipset fel",
    resultComparison: "Resultatjämförelse",
    predictedVsActual: "Prognos mot utfall",
    predictedScore: "Förväntat resultat",
    predictionEvaluation: "Prognosutvärdering",
    enginePerformance: "Prognosprecision i denna match",
    correct: "Rätt",
    incorrect: "Fel",
    predicted: "Prognos",
    actual: "Utfall",
    matchAccuracy: "Matchprecision",
    accuracySummary: (correct: number, total: number) =>
      `${correct} av ${total} tillgängliga marknader blev rätt`,
    matchDirection: "Matchriktning",
    exactScore: "Exakt resultat",
    bttsPrediction: "Båda lagen gör mål",
    overUnder25: "Över/Under 2.5",
    cornersEvaluation: "Hörnor",
    yellowCardsEvaluation: "Gula kort",
    yes: "Ja",
    no: "Nej",
    over25: "Över 2.5",
    under25: "Under 2.5",
    unavailable: "Ej tillgängligt",
  },
} as const;

function clamp(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function teamLogo(team: HeroTeam) {
  const candidates = [
    team.logo_url,
    team.logo,
    team.image_path,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim().length > 0
    ) {
      return candidate;
    }
  }

  return null;
}

function formatDate(value: string, locale: string) {
  if (!value) {
    return "";
  }

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const localeMap = {
    ar: "ar-IQ",
    en: "en-GB",
    sv: "sv-SE",
  } as const;

  return new Intl.DateTimeFormat(
    localeMap[locale as keyof typeof localeMap] ??
      "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function ProbabilityRing({
  value,
  label,
  variant: _variant,
  size = "large",
}: {
  value: number;
  label: string;
  variant: "home" | "away" | "draw";
  size?: "large" | "small";
}) {
  const percent = clamp(value);
  const degree = percent * 3.6;
  const colors =
    percent >= 60
      ? {
          active: "rgb(52 211 153)",
          track: "rgb(6 78 59 / 0.42)",
          text: "text-emerald-300",
          glow: "shadow-[0_0_42px_rgba(52,211,153,0.10)]",
        }
      : percent >= 40
        ? {
            active: "rgb(251 191 36)",
            track: "rgb(120 53 15 / 0.42)",
            text: "text-amber-300",
            glow: "shadow-[0_0_42px_rgba(251,191,36,0.10)]",
          }
        : {
            active: "rgb(251 113 133)",
            track: "rgb(136 19 55 / 0.42)",
            text: "text-rose-300",
            glow: "shadow-[0_0_42px_rgba(251,113,133,0.10)]",
          };

  const outerSize =
    size === "large"
      ? "h-28 w-28 sm:h-32 sm:w-32"
      : "h-24 w-24 sm:h-28 sm:w-28";

  const innerSize =
    size === "large"
      ? "h-[90px] w-[90px] sm:h-[104px] sm:w-[104px]"
      : "h-[76px] w-[76px] sm:h-[90px] sm:w-[90px]";

  return (
    <div
      className={`relative grid ${outerSize} shrink-0 place-items-center rounded-full ${colors.glow}`}
      style={{
        background: `conic-gradient(${colors.active} 0deg ${degree}deg, ${colors.track} ${degree}deg 360deg)`,
      }}
    >
      <div className={`grid ${innerSize} place-items-center rounded-full border border-white/[0.06] bg-[#071225]/95 shadow-inner backdrop-blur-xl`}>
        <div className="text-center">
          <p className={`${size === "large" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"} font-black tracking-tight text-white`}>
            {Math.round(percent)}%
          </p>
          <p className={`mt-1 text-[13px] font-bold ${colors.text}`}>{label}</p>
        </div>
      </div>
    </div>
  );
}

function TeamLogo({
  team,
  accent,
}: {
  team: HeroTeam;
  accent: "home" | "away";
}) {
  const logo = teamLogo(team);

  const accentClass =
    accent === "home"
      ? "border-emerald-400/15 shadow-[0_18px_60px_rgba(16,185,129,0.08)]"
      : "border-blue-400/15 shadow-[0_18px_60px_rgba(59,130,246,0.08)]";

  return (
    <div
      className={`grid h-20 w-20 place-items-center rounded-2xl border bg-slate-950/35 p-2.5 backdrop-blur-md sm:h-24 sm:w-24 ${accentClass}`}
    >
      {logo ? (
        <img
          src={logo}
          alt={team.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-4xl font-black text-slate-500">
          {team.name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function XgCard({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant: "home" | "away" | "total";
}) {
  const styles = {
    home: "text-emerald-300 border-emerald-400/10",
    away: "text-blue-300 border-blue-400/10",
    total: "text-violet-300 border-violet-400/10",
  }[variant];

  return (
    <div
      className={`rounded-2xl border bg-slate-950/45 px-4 py-3 text-center backdrop-blur-md ${styles}`}
    >
      <p className="text-2xl font-black">
        {Number(value ?? 0).toFixed(2)}
      </p>

      <p className="mt-1 text-[13px] font-semibold text-slate-400">
        {label}
      </p>
    </div>
  );
}


function normalizeForm(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .toUpperCase()
      .replace(/[^WDL]/g, "")
      .slice(-5)
      .split("");
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toUpperCase().slice(0, 1))
      .filter((item) => ["W", "D", "L"].includes(item))
      .slice(-5);
  }

  return [];
}

function FormDots({ value }: { value: unknown }) {
  const form = normalizeForm(value);

  if (form.length === 0) {
    return null;
  }

  return (
    <div dir="ltr" className="mt-3 flex items-center justify-center gap-1.5">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={[
            "grid h-6 w-6 place-items-center rounded-full border text-[11px] font-black",
            result === "W"
              ? "border-emerald-400/25 bg-emerald-400/12 text-emerald-300"
              : result === "D"
                ? "border-slate-400/25 bg-slate-400/10 text-slate-300"
                : "border-rose-400/25 bg-rose-400/10 text-rose-300",
          ].join(" ")}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

export default function MatchHero({
  match,
  homeTeam,
  awayTeam,
  expectedGoals,
  probabilities,
  mostLikelyScore,
  evaluation,
}: MatchHeroProps) {
  const { locale, direction } = useLocale();
  const text = TEXT[locale];

  const formattedDate = formatDate(
    match.date,
    locale,
  );

  const hasActualScore =
    Boolean(match.is_finished) &&
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined;

  const actualHomeScore = match.home_score ?? 0;
  const actualAwayScore = match.away_score ?? 0;

  const officialEvaluationAvailable =
    evaluation?.available === true;

  const outcomeCorrect =
    evaluation?.winner_correct === true;

  const exactScoreCorrect =
    evaluation?.exact_score_correct === true;

  const bttsCorrect =
    evaluation?.btts?.correct === true;

  const over25Correct =
    evaluation?.over_2_5?.correct === true;

  const cornersCorrect =
    evaluation?.corners?.correct === true;

  const yellowCardsCorrect =
    evaluation?.yellow_cards?.correct === true;

  const cornersPredictedLabel =
    evaluation?.corners?.line != null &&
    evaluation?.corners?.predicted === "over"
      ? locale === "ar"
        ? `أكثر من ${evaluation.corners.line}`
        : locale === "sv"
          ? `Över ${evaluation.corners.line}`
          : `Over ${evaluation.corners.line}`
      : evaluation?.corners?.line != null &&
          evaluation?.corners?.predicted === "under"
        ? locale === "ar"
          ? `أقل من ${evaluation.corners.line}`
          : locale === "sv"
            ? `Under ${evaluation.corners.line}`
            : `Under ${evaluation.corners.line}`
        : text.unavailable;

  const cornersActualLabel =
    evaluation?.corners?.actual_total != null
      ? String(evaluation.corners.actual_total)
      : text.unavailable;

  const yellowCardsPredictedLabel =
    evaluation?.yellow_cards?.line != null &&
    evaluation?.yellow_cards?.predicted === "over"
      ? locale === "ar"
        ? `أكثر من ${evaluation.yellow_cards.line}`
        : locale === "sv"
          ? `Över ${evaluation.yellow_cards.line}`
          : `Over ${evaluation.yellow_cards.line}`
      : evaluation?.yellow_cards?.line != null &&
          evaluation?.yellow_cards?.predicted === "under"
        ? locale === "ar"
          ? `أقل من ${evaluation.yellow_cards.line}`
          : locale === "sv"
            ? `Under ${evaluation.yellow_cards.line}`
            : `Under ${evaluation.yellow_cards.line}`
        : text.unavailable;

  const yellowCardsActualLabel =
    evaluation?.yellow_cards?.actual_total != null
      ? String(evaluation.yellow_cards.actual_total)
      : text.unavailable;

  const correctChecks =
    evaluation?.correct_checks ?? 0;

  const totalChecks =
    evaluation?.total_checks ?? 0;

  const matchAccuracy = Math.round(
    evaluation?.accuracy_percentage ?? 0,
  );

  const predictedBttsLabel =
    evaluation?.btts?.predicted === true
      ? text.yes
      : evaluation?.btts?.predicted === false
        ? text.no
        : text.unavailable;

  const actualBttsLabel =
    evaluation?.btts?.actual === true
      ? text.yes
      : evaluation?.btts?.actual === false
        ? text.no
        : text.unavailable;

  const predictedOver25Label =
    evaluation?.over_2_5?.predicted === true
      ? text.over25
      : evaluation?.over_2_5?.predicted === false
        ? text.under25
        : text.unavailable;

  const actualOver25Label =
    officialEvaluationAvailable
      ? String(actualHomeScore + actualAwayScore)
      : text.unavailable;

  const highestProbability = Math.max(
    probabilities.homeWin,
    probabilities.draw,
    probabilities.awayWin,
  );

  const xgDifference = Math.abs(
    expectedGoals.home - expectedGoals.away,
  );

  const predictionStrength =
    highestProbability >= 60
      ? {
          label: text.strongPrediction,
          className:
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        }
      : highestProbability >= 40
        ? {
            label: text.mediumPrediction,
            className:
              "border-amber-400/20 bg-amber-400/10 text-amber-300",
          }
        : {
            label: text.lowPrediction,
            className:
              "border-rose-400/20 bg-rose-400/10 text-rose-300",
          };

  const fallbackOutcome =
    probabilities.homeWin >= probabilities.draw &&
    probabilities.homeWin >= probabilities.awayWin
      ? "home_win"
      : probabilities.awayWin >= probabilities.draw &&
          probabilities.awayWin >= probabilities.homeWin
        ? "away_win"
        : "draw";

  const outcomeLabel = (
    outcome: string | null | undefined,
  ) => {
    if (outcome === "home_win") return `${homeTeam.name} — ${text.win}`;
    if (outcome === "away_win") return `${awayTeam.name} — ${text.win}`;
    if (outcome === "draw") return text.draw;
    return text.unavailable;
  };

  const predictedOutcomeLabel =
    outcomeLabel(fallbackOutcome);

  const predictionSummary =
    locale === "ar"
      ? `رجّح المحرك ${predictedOutcomeLabel} بنسبة ${highestProbability.toFixed(1)}%، وكانت النتيجة الدقيقة الأكثر احتمالًا ${mostLikelyScore.score}.`
      : locale === "sv"
        ? `Modellen bedömer ${predictedOutcomeLabel} som troligast med ${highestProbability.toFixed(1)}%, och ${mostLikelyScore.score} som det troligaste exakta resultatet.`
        : `The engine favors ${predictedOutcomeLabel} at ${highestProbability.toFixed(1)}%, with ${mostLikelyScore.score} as the most likely exact score.`;
  const evaluationItems = [
    {
      label: text.matchDirection,
      correct: outcomeCorrect,
      predicted: outcomeLabel(
        evaluation?.predicted_outcome ?? fallbackOutcome,
      ),
      actual: outcomeLabel(evaluation?.actual_outcome),
    },
    {
      label: text.exactScore,
      correct: exactScoreCorrect,
      predicted:
        evaluation?.predicted_score?.score ??
        mostLikelyScore.score,
      actual: `${actualHomeScore}-${actualAwayScore}`,
    },
    {
      label: text.bttsPrediction,
      correct: bttsCorrect,
      predicted: predictedBttsLabel,
      actual: actualBttsLabel,
    },
    {
      label: text.overUnder25,
      correct: over25Correct,
      predicted: predictedOver25Label,
      actual: actualOver25Label,
    },
    ...(evaluation?.corners?.available === true
      ? [
          {
            label: text.cornersEvaluation,
            correct: cornersCorrect,
            predicted: cornersPredictedLabel,
            actual: cornersActualLabel,
            probability: evaluation?.corners?.probability ?? null,
          },
        ]
      : []),
    ...(evaluation?.yellow_cards?.available === true
      ? [
          {
            label: text.yellowCardsEvaluation,
            correct: yellowCardsCorrect,
            predicted: yellowCardsPredictedLabel,
            actual: yellowCardsActualLabel,
            probability: evaluation?.yellow_cards?.probability ?? null,
          },
        ]
      : []),
  ];

  return (
    <section
      dir={direction}
      className="malx-hero relative isolate overflow-hidden rounded-[26px] border border-cyan-400/15 bg-[#030914] shadow-[0_30px_90px_rgba(0,0,0,0.38)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_44%,rgba(244,63,94,0.08),transparent_30%),radial-gradient(circle_at_82%_44%,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_50%_22%,rgba(34,211,238,0.05),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex flex-wrap items-center gap-2">
          {match.league && (
            <span className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3.5 py-1.5 text-[13px] font-bold text-slate-200">
              ⚽ {match.league}
            </span>
          )}
          <span className="rounded-full border border-slate-700/70 bg-slate-950/55 px-3.5 py-1.5 text-[13px] text-slate-400">
            #{match.id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {formattedDate && (
            <span className="rounded-full border border-slate-700/70 bg-slate-950/55 px-3.5 py-1.5 text-[13px] text-slate-300">
              ◷ {formattedDate}
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-[13px] font-black text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            {match.status}
          </span>
        </div>
      </div>

      {match.venue && (
        <div className="border-b border-white/[0.045] px-4 py-2 text-center text-[13px] text-slate-500">
          ◉ {text.venue}: {match.venue}
        </div>
      )}

      <div className="px-3 py-3.5 sm:px-6 sm:py-5 lg:px-8">
        <div dir="ltr" className="grid grid-cols-[1fr_auto_1fr] items-start gap-1.5 sm:gap-3 md:grid-cols-[1fr_0.92fr_1fr] md:items-center md:gap-3 xl:gap-7">
          <div dir={direction} className="flex min-w-0 flex-col items-center">
            <div className="flex items-center justify-center md:gap-4">
              <TeamLogo team={awayTeam} accent="away" />

              <div className="hidden md:block">
                <ProbabilityRing
                  value={probabilities.awayWin}
                  label={text.win}
                  variant="away"
                />
              </div>
            </div>

            <span className="mt-1.5 rounded-full border border-rose-400/20 bg-rose-400/[0.07] px-2 py-0.5 text-[10px] font-black text-rose-300 md:mt-3 md:px-3 md:py-1 md:text-[12px]">
              {text.awayTeam}
            </span>

            <h2 className="mt-1 max-w-full truncate text-center text-[13px] font-black leading-4 text-white sm:text-sm md:mt-2 md:text-2xl">
              {awayTeam.name}
            </h2>

            <div className="mt-2 md:hidden">
              <ProbabilityRing
                value={probabilities.awayWin}
                label={text.win}
                variant="away"
                size="small"
              />
            </div>

            {awayTeam.country && (
              <p className="mt-1 hidden text-[14px] text-slate-500 md:block">
                {awayTeam.country}
              </p>
            )}

            <div className="hidden md:block">
              <FormDots value={awayTeam.form} />
            </div>
          </div>

          <div dir={direction} className="flex min-w-0 flex-col items-center text-center">
            <p className="whitespace-nowrap text-[10px] font-black tracking-[0.06em] text-cyan-300 sm:text-[11px] md:text-[13px] md:tracking-[0.16em]">
              ✦ {text.prediction}
            </p>

            <div className="mt-1.5 rounded-xl border border-cyan-400/30 bg-cyan-950/10 px-2.5 py-2 shadow-[0_0_35px_rgba(34,211,238,0.10)] sm:px-4 md:mt-3 md:rounded-2xl md:px-8 md:py-3 lg:px-10">
              <p dir="ltr" className="whitespace-nowrap text-2xl font-black tracking-[0.04em] text-white sm:text-3xl md:text-5xl md:tracking-[0.08em]">
                {mostLikelyScore.score}
              </p>
            </div>

            <div dir="ltr" className="mt-2 hidden w-full max-w-[330px] grid-cols-[1fr_auto_1fr] items-center gap-2 text-[12px] font-bold text-slate-500 md:grid">
              <span className="truncate text-left">{homeTeam.name}</span>
              <span className="text-slate-600">HOME — AWAY</span>
              <span className="truncate text-right">{awayTeam.name}</span>
            </div>

            <span className="mt-1.5 whitespace-nowrap rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-2 py-1 text-[9px] font-black tracking-[0.03em] text-cyan-300 sm:text-[10px] md:mt-3 md:px-4 md:py-1.5 md:text-[12px] md:tracking-[0.10em]">
              ✦ {text.aiPrediction}
            </span>

            <div className="mt-2 md:mt-4">
              <ProbabilityRing
                value={probabilities.draw}
                label={text.draw}
                variant="draw"
                size="small"
              />
            </div>

            <div className="mt-3 hidden w-full max-w-[300px] md:block">
              <div className="flex justify-between text-[13px] text-slate-500">
                <span>{text.scoreProbability}</span>
                <strong dir="ltr" className="text-cyan-300">
                  {mostLikelyScore.probability.toFixed(1)}%
                </strong>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  style={{ width: `${clamp(mostLikelyScore.probability)}%` }}
                />
              </div>
            </div>

            {hasActualScore && (
              <div className="mt-2 flex flex-col items-center justify-center gap-1 md:mt-4 md:flex-row md:flex-wrap md:gap-2">
                <span className="whitespace-nowrap rounded-lg border border-slate-700/70 bg-slate-950/55 px-2 py-1 text-[9px] text-slate-500 md:rounded-xl md:px-4 md:py-2 md:text-[14px]">
                  {text.actualScore}:{" "}
                  <strong dir="ltr" className="ms-1 text-xs text-white md:text-lg">
                    {match.home_score}-{match.away_score}
                  </strong>
                </span>

                {evaluation?.available && evaluation.winner_correct != null && (
                  <span
                    className={`whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-bold md:px-3 md:py-1.5 md:text-[14px] ${
                      evaluation.winner_correct
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/25 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {evaluation.winner_correct
                      ? `✓ ${text.predictionCorrect}`
                      : `✕ ${text.predictionWrong}`}
                  </span>
                )}
              </div>
            )}
          </div>

          <div dir={direction} className="flex min-w-0 flex-col items-center">
            <div className="flex items-center justify-center md:gap-4">
              <div className="hidden md:block">
                <ProbabilityRing
                  value={probabilities.homeWin}
                  label={text.win}
                  variant="home"
                />
              </div>

              <TeamLogo team={homeTeam} accent="home" />
            </div>

            <span className="mt-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-0.5 text-[10px] font-black text-emerald-300 md:mt-3 md:px-3 md:py-1 md:text-[12px]">
              {text.homeTeam}
            </span>

            <h2 className="mt-1 max-w-full truncate text-center text-[13px] font-black leading-4 text-white sm:text-sm md:mt-2 md:text-2xl">
              {homeTeam.name}
            </h2>

            <div className="mt-2 md:hidden">
              <ProbabilityRing
                value={probabilities.homeWin}
                label={text.win}
                variant="home"
                size="small"
              />
            </div>

            {homeTeam.country && (
              <p className="mt-1 hidden text-[14px] text-slate-500 md:block">
                {homeTeam.country}
              </p>
            )}

            <div className="hidden md:block">
              <FormDots value={homeTeam.form} />
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-1.5 sm:mt-5 sm:gap-3">
          <XgCard value={expectedGoals.away} label={`${awayTeam.name} — ${text.expectedXg}`} variant="away" />
          <XgCard value={expectedGoals.total} label={text.totalXg} variant="total" />
          <XgCard value={expectedGoals.home} label={`${homeTeam.name} — ${text.expectedXg}`} variant="home" />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 border-t border-white/[0.05] pt-2.5 sm:mt-3 sm:gap-2 sm:pt-3">
          <span className={["rounded-full border px-3 py-1.5 text-[13px] font-black", predictionStrength.className].join(" ")}>
            {predictionStrength.label}
          </span>
          <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3 py-1.5 text-[13px] text-slate-400">
            {text.highestProbability}: <strong dir="ltr" className="text-cyan-300">{highestProbability.toFixed(1)}%</strong>
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[13px] text-slate-400">
            {text.difference} xG: <strong dir="ltr" className="text-white">{xgDifference.toFixed(2)}</strong>
          </span>
        </div>

        {hasActualScore && officialEvaluationAvailable && (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-slate-950/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-slate-400">{text.predictionEvaluation}</p>
                <h3 className="mt-1 text-base font-black text-white">{text.enginePerformance}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {text.accuracySummary(correctChecks, totalChecks)}
                </p>
              </div>
              <strong className={matchAccuracy >= 67 ? "text-emerald-300" : matchAccuracy >= 34 ? "text-amber-300" : "text-rose-300"}>
                {matchAccuracy}% · <span dir="ltr">{correctChecks}/{totalChecks}</span>
              </strong>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {evaluationItems.map((item) => (
                <div key={item.label} className={`min-h-[112px] rounded-xl border px-3 py-3 ${item.correct ? "border-emerald-400/15 bg-emerald-400/[0.05]" : "border-rose-400/15 bg-rose-400/[0.05]"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-black leading-5 text-slate-200">{item.label}</span>
                    <span className={item.correct ? "shrink-0 text-xl font-black text-emerald-300" : "shrink-0 text-xl font-black text-rose-300"}>{item.correct ? "✓" : "✕"}</span>
                  </div>
                  <div className="mt-3 grid gap-1.5 text-[13px] leading-4">
                    <div className="flex items-start justify-between gap-2 rounded-lg bg-black/10 px-2 py-1.5"><span className="shrink-0 font-bold text-slate-500">{text.predicted}</span><strong className="min-w-0 break-words text-end font-black text-slate-200">{item.predicted}</strong></div>
                    <div className="flex items-start justify-between gap-2 rounded-lg bg-black/10 px-2 py-1.5"><span className="shrink-0 font-bold text-slate-500">{text.actual}</span><strong className="min-w-0 break-words text-end font-black text-white">{item.actual}</strong></div>
                    {"probability" in item && item.probability != null && (
                      <div className="flex items-start justify-between gap-2 rounded-lg bg-black/10 px-2 py-1.5">
                        <span className="shrink-0 font-bold text-slate-500">{text.predictionProbability}</span>
                        <strong dir="ltr" className="min-w-0 text-end font-black text-cyan-300">
                          {Number(item.probability).toFixed(1)}%
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
