import Link from "next/link";

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
  model?: string;
};

function normalizeProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value <= 1 ? value * 100 : value;
}

function formatPercent(value: number): string {
  return `${normalizeProbability(value).toFixed(1)}%`;
}

function getPredictionStrength(value: number) {
  const probability = normalizeProbability(value);

  if (probability >= 65) {
    return {
      label: "توقع قوي",
      textClass: "text-emerald-300",
      borderClass: "border-emerald-400/30",
      backgroundClass: "bg-emerald-400/10",
      ringClass: "ring-emerald-400/20",
      dotClass: "bg-emerald-400",
    };
  }

  if (probability >= 40) {
    return {
      label: "توقع متوسط",
      textClass: "text-amber-300",
      borderClass: "border-amber-400/30",
      backgroundClass: "bg-amber-400/10",
      ringClass: "ring-amber-400/20",
      dotClass: "bg-amber-400",
    };
  }

  return {
    label: "توقع منخفض",
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

function formatMatchDate(date?: string | null): string {
  if (!date) {
    return "موعد المباراة غير متوفر";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function translateStatus(status?: string | null): string {
  const normalized = String(status ?? "").trim().toLowerCase();

  const statuses: Record<string, string> = {
    "1": "قادمة",
    "2": "قيد الانتظار",
    "3": "مباشرة",
    "4": "متوقفة مؤقتًا",
    "5": "منتهية",
    "6": "مؤجلة",
    "7": "ملغاة",
    "8": "متوقفة",
    "9": "تم التخلي عنها",

    scheduled: "قادمة",
    not_started: "قادمة",
    live: "مباشرة",
    inplay: "مباشرة",
    finished: "منتهية",
    ended: "منتهية",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
    canceled: "ملغاة",
    abandoned: "تم التخلي عنها",
    suspended: "متوقفة",
  };

  if (!normalized) {
    return "قادمة";
  }

  return statuses[normalized] ?? status ?? "غير معروفة";
}

function ComparisonBadge({
  label,
  correct,
}: {
  label: string;
  correct: boolean;
}) {
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
        {correct ? "صحيح" : "غير صحيح"}
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
              alt={`شعار ${team.name}`}
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
            الأهداف المتوقعة
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
  model = "Prediction Engine V6",
}: MatchHeroProps) {
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
    );

  const highestProbability = Math.max(
    normalizeProbability(probabilities.homeWin),
    normalizeProbability(probabilities.draw),
    normalizeProbability(probabilities.awayWin),
  );

  const predictedOutcomeLabel =
    normalizeProbability(probabilities.homeWin)
      === highestProbability
      ? `فوز ${homeTeam.name}`
      : normalizeProbability(probabilities.awayWin)
          === highestProbability
        ? `فوز ${awayTeam.name}`
        : "التعادل";

  const predictedBttsLabel =
    evaluation?.btts?.predicted === true
      ? "نعم"
      : evaluation?.btts?.predicted === false
        ? "لا"
        : "غير متوفر";

  const actualBttsLabel =
    evaluation?.btts?.actual === true
      ? "نعم"
      : evaluation?.btts?.actual === false
        ? "لا"
        : "غير متوفر";

  const predictedOver25Label =
    evaluation?.over_2_5?.predicted === true
      ? "أكثر من 2.5"
      : evaluation?.over_2_5?.predicted === false
        ? "أقل من 2.5"
        : "غير متوفر";

  const actualOver25Label =
    evaluation?.over_2_5?.actual === true
      ? "أكثر من 2.5"
      : evaluation?.over_2_5?.actual === false
        ? "أقل من 2.5"
        : "غير متوفر";

  const evaluationItems = [
    {
      label: "اتجاه المباراة",
      correct: outcomeCorrect,
      predicted:
        evaluation?.predicted_outcome === "home_win"
          ? `فوز ${homeTeam.name}`
          : evaluation?.predicted_outcome === "away_win"
            ? `فوز ${awayTeam.name}`
            : evaluation?.predicted_outcome === "draw"
              ? "التعادل"
              : predictedOutcomeLabel,
      actual:
        evaluation?.actual_outcome === "home_win"
          ? `فوز ${homeTeam.name}`
          : evaluation?.actual_outcome === "away_win"
            ? `فوز ${awayTeam.name}`
            : evaluation?.actual_outcome === "draw"
              ? "التعادل"
              : "غير متوفر",
    },
    {
      label: "النتيجة الدقيقة",
      correct: exactScoreCorrect,
      predicted:
        evaluation?.predicted_score?.score ??
        mostLikelyScore.score,
      actual: `${actualHomeScore}-${actualAwayScore}`,
    },
    {
      label: "توقع تسجيل الفريقين",
      correct: bttsCorrect,
      predicted: predictedBttsLabel,
      actual: actualBttsLabel,
    },
    {
      label: "أكثر/أقل من 2.5",
      correct: over25Correct,
      predicted: predictedOver25Label,
      actual: actualOver25Label,
    },
  ];

  return (
    <section
      dir="rtl"
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/75 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.12),transparent_36%)]" />

      <div className="relative border-b border-white/5 px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500">
              تحليل المباراة رقم {match.id}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3.5 py-2 text-xs font-black text-cyan-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
              >
                <span aria-hidden="true">⌂</span>
                الرئيسية
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-black text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <span aria-hidden="true">←</span>
                العودة للمباريات
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-xs font-bold text-cyan-300">
              {model}
            </span>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              {translateStatus(match.status)}
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
            label="الفريق المضيف"
            expectedGoals={expectedGoals.home}
            alignment="right"
          />

          <div className="mx-auto w-full max-w-sm text-center">
            <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300">
              النتيجة الأكثر احتمالًا
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
                    احتمال النتيجة
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
              النتيجة الدقيقة الأكثر احتمالًا لا تعني وحدها
              أن التعادل هو اتجاه المباراة المتوقع.
            </p>
          </div>

          <TeamPanel
            team={awayTeam}
            label="الفريق الضيف"
            expectedGoals={expectedGoals.away}
            alignment="left"
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-inner shadow-black/20">
          <div className="grid divide-y divide-white/5 sm:grid-cols-2 sm:divide-x sm:divide-x-reverse sm:divide-y-0 xl:grid-cols-4">
            <MatchMetaItem
              label="حالة المباراة"
              value={translateStatus(match.status)}
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
              label="البطولة"
              value={match.league ?? "غير متوفرة"}
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
              label="الملعب"
              value={match.venue ?? "غير متوفر"}
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
              label="التاريخ والوقت"
              value={formatMatchDate(match.date)}
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
                  مقارنة النتيجة
                </p>
                <h3 className="mt-1 font-black text-white">
                  المتوقع مقابل الفعلي
                </h3>
              </div>

              <div className="space-y-3 p-4">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="text-xs text-slate-500">
                    النتيجة المتوقعة
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
                    النتيجة الفعلية
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
                    تقييم التوقعات
                  </p>
                  <h3 className="mt-1 font-black text-white">
                    أداء المحرك في هذه المباراة
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
                          {item.correct ? "صحيح" : "غير صحيح"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2">
                          <span className="text-slate-600">
                            المتوقع
                          </span>
                          <strong className="text-slate-300">
                            {item.predicted}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2">
                          <span className="text-slate-600">
                            الفعلي
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
                        دقة هذه المباراة
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        نجح المحرك في {correctChecks} من{" "}
                        {totalChecks} مؤشرات
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
                  احتمالات نتيجة المباراة
                </p>

                <h3 className="mt-1 text-lg font-black text-white">
                  احتمالات 1X2
                </h3>
              </div>

              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-xs font-bold text-cyan-300">
                أعلى احتمال {highestProbability.toFixed(1)}%
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: `فوز ${homeTeam.name}`,
                  value: normalizeProbability(
                    probabilities.homeWin,
                  ),
                  accent: "cyan",
                },
                {
                  label: "التعادل",
                  value: normalizeProbability(
                    probabilities.draw,
                  ),
                  accent: "slate",
                },
                {
                  label: `فوز ${awayTeam.name}`,
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
                        الأعلى
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
                  مقارنة الأهداف المتوقعة
                </p>

                <h3 className="mt-1 text-lg font-black text-white">
                  Expected Goals (xG)
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-400">
                المجموع{" "}
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
                  xG المضيف
                </p>

                <strong className="mt-2 block text-2xl font-black text-cyan-300">
                  {expectedGoals.home.toFixed(2)}
                </strong>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-center">
                <p className="text-xs text-slate-500">
                  الفارق
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
                  xG الضيف
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
              اتجاه التوقع
            </p>

            <strong className="mt-3 block text-xl font-black text-cyan-300">
              {predictedOutcomeLabel}
            </strong>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              أعلى احتمال منفرد قبل انطلاق المباراة.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
            <p className="text-xs font-bold text-slate-500">
              ملخص التوقع
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              رجّح المحرك {predictedOutcomeLabel} بنسبة{" "}
              <strong className="text-white">
                {highestProbability.toFixed(1)}%
              </strong>
              ، وكانت النتيجة الدقيقة الأكثر احتمالًا{" "}
              <strong dir="ltr" className="text-cyan-300">
                {mostLikelyScore.score}
              </strong>
              .
            </p>
          </div>

          <div className="rounded-3xl border border-violet-400/15 bg-violet-400/[0.04] p-5">
            <p className="text-xs font-bold text-slate-500">
              جودة التوقع
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
                  : "قيد الانتظار"}
              </strong>

              <span className="text-xs text-slate-600">
                {correctChecks}/{totalChecks}
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              تقاس الجودة بعد انتهاء المباراة اعتمادًا على
              الأسواق الأربعة الرسمية.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
