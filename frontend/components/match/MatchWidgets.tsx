/**
 * Reusable match-analysis UI components.
 * V6.3 componentization step.
 */

const clampPercent = (value: number) =>
  Math.min(Math.max(value, 0), 100);

function confidenceLabel(label: string) {
  const labels: Record<string, string> = {
    very_high: "عالية جدًا",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return labels[label] ?? label;
}

export function ProbabilityBar({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: number;
  accent?: "cyan" | "emerald" | "violet" | "amber";
}) {
  const gradientClass = {
    cyan: "from-cyan-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-400",
    violet: "from-violet-500 to-fuchsia-500",
    amber: "from-amber-500 to-orange-500",
  }[accent];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-300">
          {label}
        </span>

        <strong className="text-xl text-white">
          {value.toFixed(1)}%
        </strong>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-l ${gradientClass} transition-all duration-700`}
          style={{
            width: `${clampPercent(value)}%`,
          }}
        />
      </div>
    </div>
  );
}

export function ConfidenceRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const degree = clampPercent(value) * 3.6;

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative grid h-40 w-40 place-items-center rounded-full"
        style={{
          background: `conic-gradient(rgb(34 211 238) ${degree}deg, rgb(30 41 59) ${degree}deg)`,
        }}
      >
        <div className="grid h-32 w-32 place-items-center rounded-full border border-slate-800 bg-slate-950 shadow-inner">
          <div className="text-center">
            <p className="text-4xl font-black text-white">
              {Math.round(value)}
            </p>
            <p className="text-xs text-slate-500">
              من 100
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-cyan-300">
        ثقة {confidenceLabel(label)}
      </p>
    </div>
  );
}

export function FormDots({
  results,
}: {
  results: string[];
}) {
  if (results.length === 0) {
    return (
      <span className="text-sm text-slate-500">
        لا توجد بيانات
      </span>
    );
  }

  return (
    <div className="flex flex-row-reverse flex-wrap gap-2">
      {results.slice(0, 5).map((result, index) => {
        const classes =
          result === "W"
            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
            : result === "D"
              ? "border-amber-400/40 bg-amber-500/20 text-amber-300"
              : "border-rose-400/40 bg-rose-500/20 text-rose-300";

        return (
          <span
            key={`${result}-${index}`}
            title={
              result === "W"
                ? "فوز"
                : result === "D"
                  ? "تعادل"
                  : "خسارة"
            }
            className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-black ${classes}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}

export function ComparisonRow({
  label,
  home,
  away,
  suffix = "",
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}) {
  const maxValue = Math.max(home, away, 1);
  const homeWidth = (home / maxValue) * 100;
  const awayWidth = (away / maxValue) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 text-sm">
        <strong className="text-cyan-300">
          {home.toFixed(1)}
          {suffix}
        </strong>

        <span className="text-slate-400">
          {label}
        </span>

        <strong className="text-violet-300">
          {away.toFixed(1)}
          {suffix}
        </strong>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex h-2.5 justify-end overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-l from-cyan-500 to-blue-500"
            style={{
              width: `${homeWidth}%`,
            }}
          />
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            style={{
              width: `${awayWidth}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function VenuePerformanceCard({
  title,
  teamName,
  strength,
  pointsPerGame,
  winRate,
  goalsFor,
  goalsAgainst,
  accent,
}: {
  title: string;
  teamName: string;
  strength: number;
  pointsPerGame: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  accent: "cyan" | "violet";
}) {
  const colors = accent === "cyan"
    ? "border-cyan-400/20 bg-cyan-500/5 text-cyan-300"
    : "border-violet-400/20 bg-violet-500/5 text-violet-300";
  const bar = accent === "cyan"
    ? "from-cyan-500 to-blue-500"
    : "from-violet-500 to-fuchsia-500";

  return (
    <div className={`rounded-3xl border p-5 ${colors}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em]">{title}</p>
      <h3 className="mt-2 text-xl font-black text-white">{teamName}</h3>
      <div className="mt-5 grid grid-cols-2 gap-3 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">قوة المكان</p>
          <p className="mt-1 text-xl font-black">{(strength * 100).toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">نقاط/مباراة</p>
          <p className="mt-1 text-xl font-black">{pointsPerGame.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">نسبة الفوز</p>
          <p className="mt-1 text-xl font-black">{winRate.toFixed(0)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-slate-500">الأهداف</p>
          <p className="mt-1 text-sm font-bold">{goalsFor.toFixed(2)} له / {goalsAgainst.toFixed(2)} عليه</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-l ${bar}`} style={{ width: `${clampPercent(strength * 100)}%` }} />
      </div>
    </div>
  );
}

export function MomentumDetailCard({
  teamName,
  score,
  weightedPoints,
  goalsFor,
  goalsAgainst,
  goalBalance,
  streakType,
  streakLength,
  accent,
}: {
  teamName: string;
  score: number;
  weightedPoints: number;
  goalsFor: number;
  goalsAgainst: number;
  goalBalance: number;
  streakType: string;
  streakLength: number;
  accent: "cyan" | "violet";
}) {
  const bar = accent === "cyan"
    ? "from-cyan-500 to-blue-500"
    : "from-violet-500 to-fuchsia-500";
  const textColor = accent === "cyan" ? "text-cyan-300" : "text-violet-300";

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-black text-white">{teamName}</h3>
        <span className={`rounded-full bg-slate-900 px-3 py-1 text-sm font-black ${textColor}`}>
          {(score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-l ${bar}`} style={{ width: `${clampPercent(score * 100)}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-slate-800 p-3"><p className="text-slate-500">النقاط الموزونة</p><p className="mt-1 font-bold text-white">{(weightedPoints * 100).toFixed(1)}%</p></div>
        <div className="rounded-2xl border border-slate-800 p-3"><p className="text-slate-500">السلسلة الحالية</p><p className="mt-1 font-bold text-white">{streakType} × {streakLength}</p></div>
        <div className="rounded-2xl border border-slate-800 p-3"><p className="text-slate-500">أهداف مسجلة</p><p className="mt-1 font-bold text-emerald-300">{goalsFor.toFixed(2)}</p></div>
        <div className="rounded-2xl border border-slate-800 p-3"><p className="text-slate-500">أهداف مستقبلة</p><p className="mt-1 font-bold text-rose-300">{goalsAgainst.toFixed(2)}</p></div>
      </div>
      <p className="mt-4 text-sm text-slate-400">توازن الأهداف: <strong className={goalBalance >= 0 ? "text-emerald-300" : "text-rose-300"}>{goalBalance.toFixed(2)}</strong></p>
    </div>
  );
}

export function Timeline({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const activeIndex = normalized.includes("finish")
    ? 2
    : normalized.includes("live")
      ? 1
      : 0;

  const steps = [
    {
      title: "قبل المباراة",
      subtitle: "Scheduled",
    },
    {
      title: "مباشر",
      subtitle: "Live",
    },
    {
      title: "انتهت",
      subtitle: "Finished",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => {
        const active = index <= activeIndex;
        const current = index === activeIndex;

        return (
          <div
            key={step.subtitle}
            className={`relative rounded-2xl border p-4 text-center ${
              current
                ? "border-cyan-400/50 bg-cyan-500/10"
                : active
                  ? "border-emerald-400/20 bg-emerald-500/5"
                  : "border-slate-800 bg-slate-950/50"
            }`}
          >
            <span
              className={`mx-auto mb-3 block h-3 w-3 rounded-full ${
                current
                  ? "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                  : active
                    ? "bg-emerald-400"
                    : "bg-slate-700"
              }`}
            />

            <p className="font-bold text-white">
              {step.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {step.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
