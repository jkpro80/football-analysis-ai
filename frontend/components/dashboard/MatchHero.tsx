"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";
type Team = {
  id?: number;
  name: string;
  short_name?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
  country?: string | null;
};

type MatchData = {
  id: number;
  date?: string | null;
  status?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  is_finished?: boolean;
  actual_outcome?: string | null;
  venue?: string | null;
  league?: string | null;
  home_team?: Team | string;
  away_team?: Team | string;
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
};

type MatchHeroProps = {
  match: MatchData;
  homeTeam: Team;
  awayTeam: Team;

  expectedGoals: {
    home: number;
    away: number;
    total?: number;
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

const MATCH_HERO_TEXT = {
  ar: {
    analysisNumber: (id: number) => `تحليل المباراة رقم ${id}`,
    home: "الرئيسية",
    backToMatches: "العودة للمباريات",
    homeTeam: "الفريق المضيف",
    awayTeam: "الفريق الضيف",
    teamLogo: "شعار",
    expectedGoals: "الأهداف المتوقعة",
    mostLikelyScore: "النتيجة الأكثر احتمالًا",
    scoreProbability: "احتمال النتيجة",
    strongPrediction: "توقع قوي",
    mediumPrediction: "توقع متوسط",
    lowPrediction: "توقع منخفض",
    scoreNote:
      "النتيجة الدقيقة الأكثر احتمالًا لا تعني وحدها أن التعادل هو اتجاه المباراة المتوقع.",
    matchStatus: "حالة المباراة",
    competition: "البطولة",
    venue: "الملعب",
    dateTime: "التاريخ والوقت",
    unavailable: "غير متوفر",
    unavailableFeminine: "غير متوفرة",
    matchTimeUnavailable: "موعد المباراة غير متوفر",
    resultComparison: "مقارنة النتيجة",
    predictedVsActual: "المتوقع مقابل الفعلي",
    predictedScore: "النتيجة المتوقعة",
    actualScore: "النتيجة الفعلية",
    predictionEvaluation: "تقييم التوقعات",
    enginePerformance: "أداء المحرك في هذه المباراة",
    correct: "صحيح",
    incorrect: "غير صحيح",
    predicted: "المتوقع",
    actual: "الفعلي",
    matchAccuracy: "دقة هذه المباراة",
    accuracySummary: (correct: number, total: number) =>
      `نجح المحرك في ${correct} من ${total} مؤشرات`,
    matchDirection: "اتجاه المباراة",
    exactScore: "النتيجة الدقيقة",
    bttsPrediction: "توقع تسجيل الفريقين",
    overUnder25: "أكثر/أقل من 2.5",
    yes: "نعم",
    no: "لا",
    over25: "أكثر من 2.5",
    under25: "أقل من 2.5",
    draw: "التعادل",
    win: (team: string) => `فوز ${team}`,
    resultProbabilities: "احتمالات نتيجة المباراة",
    probabilities1x2: "احتمالات 1X2",
    highestProbability: "أعلى احتمال",
    highest: "الأعلى",
    expectedGoalsComparison: "مقارنة الأهداف المتوقعة",
    total: "المجموع",
    homeXg: "xG المضيف",
    difference: "الفارق",
    awayXg: "xG الضيف",
    predictionDirection: "اتجاه التوقع",
    directionNote: "أعلى احتمال منفرد قبل انطلاق المباراة.",
    predictionSummary: "ملخص التوقع",
    predictionSummaryText: (
      outcome: string,
      probability: string,
      score: string,
    ) =>
      `رجّح المحرك ${outcome} بنسبة ${probability}، وكانت النتيجة الدقيقة الأكثر احتمالًا ${score}.`,
    predictionQuality: "جودة التوقع",
    pending: "قيد الانتظار",
    qualityNote:
      "تقاس الجودة بعد انتهاء المباراة اعتمادًا على الأسواق الأربعة الرسمية.",
    scheduled: "قادمة",
    waiting: "قيد الانتظار",
    live: "مباشرة",
    paused: "متوقفة مؤقتًا",
    finished: "منتهية",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
    suspended: "متوقفة",
    abandoned: "تم التخلي عنها",
    unknown: "غير معروفة",
  },

  en: {
    analysisNumber: (id: number) => `Match Analysis #${id}`,
    home: "Home",
    backToMatches: "Back to Matches",
    homeTeam: "Home Team",
    awayTeam: "Away Team",
    teamLogo: "Logo of",
    expectedGoals: "Expected Goals",
    mostLikelyScore: "Most Likely Score",
    scoreProbability: "Score Probability",
    strongPrediction: "Strong Prediction",
    mediumPrediction: "Medium Prediction",
    lowPrediction: "Low Prediction",
    scoreNote:
      "The most likely exact score does not by itself mean that a draw is the expected match outcome.",
    matchStatus: "Match Status",
    competition: "Competition",
    venue: "Venue",
    dateTime: "Date & Time",
    unavailable: "Not available",
    unavailableFeminine: "Not available",
    matchTimeUnavailable: "Match time is not available",
    resultComparison: "Score Comparison",
    predictedVsActual: "Predicted vs Actual",
    predictedScore: "Predicted Score",
    actualScore: "Actual Score",
    predictionEvaluation: "Prediction Evaluation",
    enginePerformance: "Engine performance in this match",
    correct: "Correct",
    incorrect: "Incorrect",
    predicted: "Predicted",
    actual: "Actual",
    matchAccuracy: "Match Accuracy",
    accuracySummary: (correct: number, total: number) =>
      `The engine got ${correct} of ${total} indicators correct`,
    matchDirection: "Match Outcome",
    exactScore: "Exact Score",
    bttsPrediction: "Both Teams to Score",
    overUnder25: "Over/Under 2.5",
    yes: "Yes",
    no: "No",
    over25: "Over 2.5",
    under25: "Under 2.5",
    draw: "Draw",
    win: (team: string) => `${team} Win`,
    resultProbabilities: "Match Result Probabilities",
    probabilities1x2: "1X2 Probabilities",
    highestProbability: "Highest Probability",
    highest: "Highest",
    expectedGoalsComparison: "Expected Goals Comparison",
    total: "Total",
    homeXg: "Home xG",
    difference: "Difference",
    awayXg: "Away xG",
    predictionDirection: "Prediction Direction",
    directionNote: "Highest single probability before kickoff.",
    predictionSummary: "Prediction Summary",
    predictionSummaryText: (
      outcome: string,
      probability: string,
      score: string,
    ) =>
      `The engine favors ${outcome} at ${probability}, with ${score} as the most likely exact score.`,
    predictionQuality: "Prediction Quality",
    pending: "Pending",
    qualityNote:
      "Quality is measured after the match using the four official evaluation markets.",
    scheduled: "Upcoming",
    waiting: "Pending",
    live: "Live",
    paused: "Paused",
    finished: "Finished",
    postponed: "Postponed",
    cancelled: "Cancelled",
    suspended: "Suspended",
    abandoned: "Abandoned",
    unknown: "Unknown",
  },

  sv: {
    analysisNumber: (id: number) => `Matchanalys #${id}`,
    home: "Hem",
    backToMatches: "Tillbaka till matcher",
    homeTeam: "Hemmalag",
    awayTeam: "Bortalag",
    teamLogo: "Logotyp för",
    expectedGoals: "Förväntade mål",
    mostLikelyScore: "Troligaste resultat",
    scoreProbability: "Resultatsannolikhet",
    strongPrediction: "Stark prognos",
    mediumPrediction: "Medelstark prognos",
    lowPrediction: "Svag prognos",
    scoreNote:
      "Det troligaste exakta resultatet innebär inte i sig att oavgjort är det förväntade matchutfallet.",
    matchStatus: "Matchstatus",
    competition: "Tävling",
    venue: "Arena",
    dateTime: "Datum och tid",
    unavailable: "Inte tillgängligt",
    unavailableFeminine: "Inte tillgängligt",
    matchTimeUnavailable: "Matchtiden är inte tillgänglig",
    resultComparison: "Resultatjämförelse",
    predictedVsActual: "Prognos mot faktiskt resultat",
    predictedScore: "Förväntat resultat",
    actualScore: "Faktiskt resultat",
    predictionEvaluation: "Utvärdering av prognosen",
    enginePerformance: "Modellens resultat i den här matchen",
    correct: "Rätt",
    incorrect: "Fel",
    predicted: "Prognos",
    actual: "Faktiskt",
    matchAccuracy: "Träffsäkerhet för matchen",
    accuracySummary: (correct: number, total: number) =>
      `Modellen hade rätt på ${correct} av ${total} indikatorer`,
    matchDirection: "Matchutfall",
    exactScore: "Exakt resultat",
    bttsPrediction: "Båda lagen gör mål",
    overUnder25: "Över/Under 2,5",
    yes: "Ja",
    no: "Nej",
    over25: "Över 2,5",
    under25: "Under 2,5",
    draw: "Oavgjort",
    win: (team: string) => `${team} vinner`,
    resultProbabilities: "Sannolikheter för matchresultat",
    probabilities1x2: "1X2-sannolikheter",
    highestProbability: "Högsta sannolikhet",
    highest: "Högst",
    expectedGoalsComparison: "Jämförelse av förväntade mål",
    total: "Totalt",
    homeXg: "Hemma-xG",
    difference: "Skillnad",
    awayXg: "Borta-xG",
    predictionDirection: "Prognosriktning",
    directionNote: "Högsta enskilda sannolikhet före avspark.",
    predictionSummary: "Prognossammanfattning",
    predictionSummaryText: (
      outcome: string,
      probability: string,
      score: string,
    ) =>
      `Modellen bedömer ${outcome} som troligast med ${probability}, och ${score} som det troligaste exakta resultatet.`,
    predictionQuality: "Prognoskvalitet",
    pending: "Väntar",
    qualityNote:
      "Kvaliteten mäts efter matchen utifrån de fyra officiella utvärderingsmarknaderna.",
    scheduled: "Kommande",
    waiting: "Väntar",
    live: "Live",
    paused: "Pausad",
    finished: "Avslutad",
    postponed: "Uppskjuten",
    cancelled: "Inställd",
    suspended: "Avbruten",
    abandoned: "Övergiven",
    unknown: "Okänd",
  },
} satisfies Record<Locale, Record<string, unknown>>;
function normalizeProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value <= 1 ? value * 100 : value;
}

function formatPercent(value: number): string {
  return `${normalizeProbability(value).toFixed(1)}%`;
}

function getPredictionStrength(value: number, locale: Locale) {
  const text = MATCH_HERO_TEXT[locale];
  const probability = normalizeProbability(value);

  if (probability >= 65) {
    return {
      label: text.strongPrediction,
      textClass: "text-emerald-300",
      borderClass: "border-emerald-400/30",
      backgroundClass: "bg-emerald-400/10",
      ringClass: "ring-emerald-400/20",
      dotClass: "bg-emerald-400",
    };
  }

  if (probability >= 40) {
    return {
      label: text.mediumPrediction,
      textClass: "text-amber-300",
      borderClass: "border-amber-400/30",
      backgroundClass: "bg-amber-400/10",
      ringClass: "ring-amber-400/20",
      dotClass: "bg-amber-400",
    };
  }

  return {
    label: text.lowPrediction,
    textClass: "text-rose-300",
    borderClass: "border-rose-400/30",
    backgroundClass: "bg-rose-400/10",
    ringClass: "ring-rose-400/20",
    dotClass: "bg-rose-400",
  };
}

function getTeamInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatMatchDate(
  date: string | null | undefined,
  locale: Locale,
): string {
  const text = MATCH_HERO_TEXT[locale];

  if (!date) {
    return text.matchTimeUnavailable as string;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const intlLocale =
    locale === "sv"
      ? "sv-SE"
      : locale === "en"
        ? "en-US"
        : "ar-IQ";

  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function translateStatus(
  status: string | null | undefined,
  locale: Locale,
): string {
  const text = MATCH_HERO_TEXT[locale];

  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  const statuses: Record<string, string> = {
    "1": text.scheduled as string,
    "2": text.waiting as string,
    "3": text.live as string,
    "4": text.paused as string,
    "5": text.finished as string,
    "6": text.postponed as string,
    "7": text.cancelled as string,
    "8": text.suspended as string,
    "9": text.abandoned as string,

    scheduled: text.scheduled as string,
    not_started: text.scheduled as string,
    pending: text.waiting as string,
    live: text.live as string,
    inplay: text.live as string,
    "in-play": text.live as string,
    finished: text.finished as string,
    ended: text.finished as string,
    completed: text.finished as string,
    ft: text.finished as string,
    halftime: text.paused as string,
    ht: text.paused as string,
    postponed: text.postponed as string,
    cancelled: text.cancelled as string,
    canceled: text.cancelled as string,
    abandoned: text.abandoned as string,
    suspended: text.suspended as string,
  };

  if (!normalized) {
    return text.scheduled as string;
  }

  return (
    statuses[normalized] ??
    status ??
    (text.unknown as string)
  );
}
function ComparisonBadge({
  label,
  correct,
}: {
  label: string;
  correct: boolean;
}) {
  const { locale } = useLocale();
  const text = MATCH_HERO_TEXT[locale];

  return (
    <div
      className={[
        "flex items-center justify-between gap-3",
        "rounded-xl border px-3 py-2 text-xs",
        correct
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-rose-500/20 bg-rose-500/10",
      ].join(" ")}
    >
      <span className="font-bold text-slate-300">
        {label}
      </span>

      <strong
        className={
          correct
            ? "text-emerald-300"
            : "text-rose-300"
        }
      >
        {correct ? text.correct : text.incorrect}
      </strong>
    </div>
  );
}

function TeamPanel({
  team,
  label,
  expectedGoals,
  alignment,
}: {
  team: Team;
  label: string;
  expectedGoals: number;
  alignment: "right" | "left";
}) {
  const { locale } = useLocale();
  const text = MATCH_HERO_TEXT[locale];

  const justifyClass =
    alignment === "right"
      ? "lg:justify-start"
      : "lg:justify-end";

  return (
    <div
      className={[
        "flex flex-col items-center gap-4 text-center",
        "lg:flex-row lg:text-start",
        justifyClass,
        alignment === "left" ? "lg:flex-row-reverse" : "",
      ].join(" ")}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />

        <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-white/10 bg-slate-900 shadow-2xl sm:h-28 sm:w-28">
          {(team.logo_url ?? team.logo ?? team.image_path) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logo_url ?? team.logo ?? team.image_path ?? ""}
              alt={`${text.teamLogo} ${team.name}`}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            />
          ) : (
            <span className="text-2xl font-black text-cyan-300">
              {getTeamInitials(team.name)}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>

        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
          {team.name}
        </h2>

        {team.country &&
team.country.trim().toLowerCase() !== "unknown" ? (
  <p className="mt-1 text-sm text-slate-500">
    {team.country}
  </p>
) : null}

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-4 py-2">
          <span className="text-xs text-slate-400">
            {text.expectedGoals}
          </span>

          <strong className="text-lg font-black text-cyan-300">
            {expectedGoals.toFixed(2)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function ProbabilityItem({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: number;
  accentClass: string;
}) {
  const percent = Math.max(
    0,
    Math.min(100, normalizeProbability(value)),
  );

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/55 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500">
          {label}
        </span>

        <strong className={accentClass}>
          {percent.toFixed(1)}%
        </strong>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-current transition-all duration-700"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function MatchMetaItem({
  label,
  value,
  icon,
  accentClass = "text-white",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentClass?: string;
}) {
  const { locale } = useLocale();
  const text = MATCH_HERO_TEXT[locale];

  return (
    <div className="group flex min-h-24 items-center justify-center gap-3 border-white/5 p-4 text-center transition hover:bg-white/[0.025]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-lg text-slate-400 transition group-hover:border-cyan-400/20 group-hover:text-cyan-300">
        {icon}
      </span>

      <div className="min-w-0 text-start">
        <p className="text-[11px] font-bold text-slate-600">
          {label}
        </p>

        <strong
          className={[
            "mt-1 block truncate text-sm font-black",
            accentClass,
          ].join(" ")}
          title={value}
        >
          {value}
        </strong>
      </div>
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
  const text = MATCH_HERO_TEXT[locale];

  const hasFinalScore =
    match.is_finished === true &&
    typeof match.home_score === "number" &&
    typeof match.away_score === "number";

  const actualHomeScore =
    match.home_score ?? 0;

  const actualAwayScore =
    match.away_score ?? 0;

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

  const correctChecks =
    evaluation?.correct_checks ?? 0;

  const totalChecks =
    evaluation?.total_checks ?? 0;

  const matchAccuracy = Math.round(
    evaluation?.accuracy_percentage ?? 0,
  );

  const predictionStrength =
    getPredictionStrength(
      mostLikelyScore.probability,
      locale,
    );

  const highestProbability = Math.max(
    normalizeProbability(probabilities.homeWin),
    normalizeProbability(probabilities.draw),
    normalizeProbability(probabilities.awayWin),
  );

  const predictedOutcomeLabel =
    normalizeProbability(probabilities.homeWin)
      === highestProbability
      ? text.win(homeTeam.name)
      : normalizeProbability(probabilities.awayWin)
          === highestProbability
        ? text.win(awayTeam.name)
        : text.draw;

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
    evaluation?.over_2_5?.actual === true
      ? text.over25
      : evaluation?.over_2_5?.actual === false
        ? text.under25
        : text.unavailable;

  const evaluationItems = [
    {
      label: text.matchDirection,
      correct: outcomeCorrect,
      predicted:
        evaluation?.predicted_outcome === "home_win"
          ? text.win(homeTeam.name)
          : evaluation?.predicted_outcome === "away_win"
            ? text.win(awayTeam.name)
            : evaluation?.predicted_outcome === "draw"
              ? text.draw
              : predictedOutcomeLabel,
      actual:
        evaluation?.actual_outcome === "home_win"
          ? text.win(homeTeam.name)
          : evaluation?.actual_outcome === "away_win"
            ? text.win(awayTeam.name)
            : evaluation?.actual_outcome === "draw"
              ? text.draw
              : text.unavailable,
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
  ];

  return (
    <section
      dir={direction}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/75 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.12),transparent_36%)]" />

      <div className="relative border-b border-white/5 px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500">
              {text.analysisNumber(match.id)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3.5 py-2 text-xs font-black text-cyan-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
              >
                <span aria-hidden="true">⌂</span>
                {text.home}
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-black text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span aria-hidden="true">←</span>
                {text.backToMatches}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              {translateStatus(match.status, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-6 sm:px-8 lg:px-10">
        <div
          dir="ltr"
          className="grid items-center gap-8 lg:grid-cols-[1fr_300px_1fr]"
        >
          <TeamPanel
            team={homeTeam}
            label={text.homeTeam}
            expectedGoals={expectedGoals.home}
            alignment="right"
          />

          <div className="mx-auto w-full max-w-sm text-center">
            <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300">
              {text.mostLikelyScore}
            </span>

            <div dir="ltr" className="mt-4">
              <strong className="bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
                {mostLikelyScore.score}
              </strong>
            </div>

            <div className="mt-4 flex justify-center">
              <div
                className={[
                  "inline-flex items-center gap-3 rounded-full border px-4 py-2 ring-4",
                  predictionStrength.borderClass,
                  predictionStrength.backgroundClass,
                  predictionStrength.ringClass,
                ].join(" ")}
              >
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full",
                    predictionStrength.dotClass,
                  ].join(" ")}
                />

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    {text.scoreProbability}
                  </span>

                  <strong
                    className={[
                      "text-sm font-black",
                      predictionStrength.textClass,
                    ].join(" ")}
                  >
                    {formatPercent(
                      mostLikelyScore.probability,
                    )}
                  </strong>
                </div>

                <span
                  className={[
                    "border-r border-white/10 pr-3 text-xs font-black",
                    predictionStrength.textClass,
                  ].join(" ")}
                >
                  {predictionStrength.label}
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              {text.scoreNote}
            </p>
          </div>

          <TeamPanel
            team={awayTeam}
            label={text.awayTeam}
            expectedGoals={expectedGoals.away}
            alignment="left"
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-inner shadow-black/20">
          <div className="grid divide-y divide-white/5 sm:grid-cols-2 sm:divide-x sm:divide-x-reverse sm:divide-y-0 xl:grid-cols-4">
            <MatchMetaItem
              label={text.matchStatus}
              value={translateStatus(match.status, locale)}
              accentClass="text-emerald-300"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="m7 12 3 3 7-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              }
            />

            <MatchMetaItem
              label={text.competition}
              value={match.league ?? text.unavailableFeminine}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M8 4h8v3c0 3-1.8 5-4 5s-4-2-4-5V4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6H5v1c0 2.3 1.4 4 3.6 4.5M16 6h3v1c0 2.3-1.4 4-3.6 4.5M12 12v4M9 20h6M10 16h4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />

            <MatchMetaItem
              label={text.venue}
              value={match.venue ?? text.unavailable}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 9c2.2-2 5-3 8-3s5.8 1 8 3v8H4V9Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 17v-4h8v4M4 10h16M7 7V4M17 7V4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />

            <MatchMetaItem
              label={text.dateTime}
              value={formatMatchDate(match.date, locale)}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect
                    x="4"
                    y="5"
                    width="16"
                    height="15"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 3v4M16 3v4M4 10h16"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 14h3M13 14h3M8 17h3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {hasFinalScore && officialEvaluationAvailable ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-[290px_1fr]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55">
              <div className="border-b border-white/5 px-5 py-4">
                <p className="text-xs font-bold text-slate-500">
                  {text.resultComparison}
                </p>
                <h3 className="mt-1 font-black text-white">
                  {text.predictedVsActual}
                </h3>
              </div>

              <div className="space-y-3 p-4">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="text-xs text-slate-500">
                    {text.predictedScore}
                  </p>

                  <strong
                    dir="ltr"
                    className="mt-2 block text-center text-4xl font-black text-cyan-300"
                  >
                    {mostLikelyScore.score}
                  </strong>
                </div>

                <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
                  <p className="text-xs text-slate-500">
                    {text.actualScore}
                  </p>

                  <strong
                    dir="ltr"
                    className="mt-2 block text-center text-4xl font-black text-violet-300"
                  >
                    {actualHomeScore}-{actualAwayScore}
                  </strong>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/45">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    {text.predictionEvaluation}
                  </p>
                  <h3 className="mt-1 font-black text-white">
                    {text.enginePerformance}
                  </h3>
                </div>

                <span
                  className={[
                    "inline-flex min-w-20 items-center justify-center rounded-full border px-4 py-2 text-sm font-black shadow-lg",
                    matchAccuracy >= 67
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : matchAccuracy >= 34
                        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                        : "border-rose-400/20 bg-rose-400/10 text-rose-300",
                  ].join(" ")}
                >
                  {totalChecks} / {correctChecks}
                </span>
              </div>

              <div className="p-5">
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                  {evaluationItems.map((item) => (
                    <div
                      key={item.label}
                      className={[
                        "rounded-2xl border p-4",
                        item.correct
                          ? "border-emerald-400/20 bg-emerald-400/[0.07]"
                          : "border-rose-400/20 bg-rose-400/[0.07]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-black",
                              item.correct
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                : "border-rose-400/30 bg-rose-400/10 text-rose-300",
                            ].join(" ")}
                          >
                            {item.correct ? "✓" : "✕"}
                          </span>

                          <p className="text-xs font-black leading-6 text-slate-200">
                            {item.label}
                          </p>
                        </div>

                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-[11px] font-black",
                            item.correct
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : "border-rose-400/20 bg-rose-400/10 text-rose-300",
                          ].join(" ")}
                        >
                          {item.correct ? text.correct : text.incorrect}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2">
                          <span className="text-slate-600">
                            {text.predicted}
                          </span>
                          <strong className="text-slate-300">
                            {item.predicted}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2">
                          <span className="text-slate-600">
                            {text.actual}
                          </span>
                          <strong className="text-white">
                            {item.actual}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/20">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-white">
                        {text.matchAccuracy}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {text.accuracySummary(
                          correctChecks,
                          totalChecks,
                        )}
                      </p>
                    </div>

                    <strong
                      className={[
                        "text-4xl font-black",
                        matchAccuracy >= 67
                          ? "text-emerald-300"
                          : matchAccuracy >= 34
                            ? "text-amber-300"
                            : "text-rose-300",
                      ].join(" ")}
                    >
                      {matchAccuracy}%
                    </strong>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={[
                        "h-full rounded-full transition-all duration-700",
                        matchAccuracy >= 67
                          ? "bg-emerald-400"
                          : matchAccuracy >= 34
                            ? "bg-amber-400"
                            : "bg-rose-400",
                      ].join(" ")}
                      style={{
                        width:
                          matchAccuracy > 0
                            ? `${matchAccuracy}%`
                            : "6px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-inner shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  {text.resultProbabilities}
                </p>

                <h3 className="mt-1 text-lg font-black text-white">
                  {text.probabilities1x2}
                </h3>
              </div>

              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-xs font-bold text-cyan-300">
                {text.highestProbability} {highestProbability.toFixed(1)}%
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: text.win(homeTeam.name),
                  value: normalizeProbability(
                    probabilities.homeWin,
                  ),
                  accent: "cyan",
                },
                {
                  label: text.draw,
                  value: normalizeProbability(
                    probabilities.draw,
                  ),
                  accent: "slate",
                },
                {
                  label: text.win(awayTeam.name),
                  value: normalizeProbability(
                    probabilities.awayWin,
                  ),
                  accent: "violet",
                },
              ].map((item) => {
                const isHighest =
                  item.value === highestProbability;

                const cardClass =
                  item.accent === "cyan"
                    ? "border-cyan-400/20 bg-cyan-400/[0.055]"
                    : item.accent === "violet"
                      ? "border-violet-400/20 bg-violet-400/[0.055]"
                      : "border-white/10 bg-white/[0.025]";

                const valueClass =
                  item.accent === "cyan"
                    ? "text-cyan-300"
                    : item.accent === "violet"
                      ? "text-violet-300"
                      : "text-white";

                const barClass =
                  item.accent === "cyan"
                    ? "bg-cyan-400"
                    : item.accent === "violet"
                      ? "bg-violet-400"
                      : "bg-slate-300";

                return (
                  <div
                    key={item.label}
                    className={[
                      "relative overflow-hidden rounded-2xl border p-4 transition",
                      cardClass,
                      isHighest
                        ? "ring-1 ring-cyan-300/30"
                        : "",
                    ].join(" ")}
                  >
                    {isHighest ? (
                      <span className="absolute left-3 top-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-300">
                        {text.highest}
                      </span>
                    ) : null}

                    <p className="truncate text-xs font-bold text-slate-500">
                      {item.label}
                    </p>

                    <strong
                      className={[
                        "mt-3 block text-3xl font-black",
                        valueClass,
                      ].join(" ")}
                    >
                      {item.value.toFixed(1)}%
                    </strong>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={[
                          "h-full rounded-full transition-all duration-700",
                          barClass,
                        ].join(" ")}
                        style={{
                          width: `${item.value}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-inner shadow-black/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  {text.expectedGoalsComparison}
                </p>

                <h3 className="mt-1 text-lg font-black text-white">
                  Expected Goals (xG)
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-400">
                {text.total}{" "}
                {(
                  expectedGoals.total ??
                  expectedGoals.home +
                    expectedGoals.away
                ).toFixed(2)}
              </span>
            </div>

            <div
              dir="ltr"
              className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-bold text-slate-500">
                    {homeTeam.name}
                  </p>

                  <strong className="text-3xl font-black text-cyan-300">
                    {expectedGoals.home.toFixed(2)}
                  </strong>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                    style={{
                      width: `${
                        (
                          expectedGoals.home /
                          Math.max(
                            expectedGoals.home +
                              expectedGoals.away,
                            0.01,
                          )
                        ) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-xs font-black text-slate-500">
                VS
              </span>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-bold text-slate-500">
                    {awayTeam.name}
                  </p>

                  <strong className="text-3xl font-black text-violet-300">
                    {expectedGoals.away.toFixed(2)}
                  </strong>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-violet-400 transition-all duration-700"
                    style={{
                      width: `${
                        (
                          expectedGoals.away /
                          Math.max(
                            expectedGoals.home +
                              expectedGoals.away,
                            0.01,
                          )
                        ) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4 text-center">
                <p className="text-xs text-slate-500">
                  {text.homeXg}
                </p>

                <strong className="mt-2 block text-2xl font-black text-cyan-300">
                  {expectedGoals.home.toFixed(2)}
                </strong>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
                <p className="text-xs text-slate-500">
                  {text.difference}
                </p>

                <strong className="mt-2 block text-2xl font-black text-white">
                  {Math.abs(
                    expectedGoals.home -
                      expectedGoals.away,
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] p-4 text-center">
                <p className="text-xs text-slate-500">
                  {text.awayXg}
                </p>

                <strong className="mt-2 block text-2xl font-black text-violet-300">
                  {expectedGoals.away.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5">
            <p className="text-xs font-bold text-slate-500">
              {text.predictionDirection}
            </p>

            <strong className="mt-3 block text-xl font-black text-cyan-300">
              {predictedOutcomeLabel}
            </strong>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              {text.directionNote}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
            <p className="text-xs font-bold text-slate-500">
              {text.predictionSummary}
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {text.predictionSummaryText(
                predictedOutcomeLabel,
                `${highestProbability.toFixed(1)}%`,
                mostLikelyScore.score,
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-violet-400/15 bg-violet-400/[0.04] p-5">
            <p className="text-xs font-bold text-slate-500">
              {text.predictionQuality}
            </p>

            <div className="mt-3 flex items-end justify-between">
              <strong
                className={[
                  "text-4xl font-black",
                  matchAccuracy >= 67
                    ? "text-emerald-300"
                    : matchAccuracy >= 34
                      ? "text-amber-300"
                      : "text-rose-300",
                ].join(" ")}
              >
                {officialEvaluationAvailable
                  ? `${matchAccuracy}%`
                  : text.pending}
              </strong>

              <span className="text-xs text-slate-600">
                {correctChecks}/{totalChecks}
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              {text.qualityNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}




