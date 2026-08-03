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
  venue?: string | null;
  league?: string | null;
  home_team?: Team | string;
  away_team?: Team | string;
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

export default function MatchHero({
  match,
  homeTeam,
  awayTeam,
  expectedGoals,
  probabilities,
  mostLikelyScore,
  model = "Prediction Engine V6",
}: MatchHeroProps) {
  return (
    <section
      dir="rtl"
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.12),transparent_36%)]" />

      <div className="relative border-b border-white/5 px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-bold text-cyan-300 transition hover:text-cyan-200"
          >
            ← العودة إلى المباريات
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-300">
              {model}
            </span>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
              {translateStatus(match.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7">
        <div className="mb-9 text-center">
          {match.league ? (
            <p className="text-sm font-black text-cyan-300">
              {match.league}
            </p>
          ) : null}

          <p className="mt-2 text-sm text-slate-400">
            {formatMatchDate(match.date)}
          </p>

          {match.venue ? (
            <p className="mt-1 text-xs text-slate-500">
              الملعب: {match.venue}
            </p>
          ) : null}
        </div>

        <div
          dir="ltr"
          className="grid items-center gap-10 lg:grid-cols-[1fr_320px_1fr]"
        >
          <TeamPanel
            team={homeTeam}
            label="الفريق المضيف"
            expectedGoals={expectedGoals.home}
            alignment="right"
          />

          <div className="mx-auto w-full max-w-sm text-center">
            <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300">
              المباراة رقم {match.id}
            </span>

            <p className="mt-6 text-xs font-bold tracking-wider text-slate-500">
              أكثر نتيجة دقيقة احتمالًا
              <span
                dir="ltr"
                className="mr-1 text-slate-600"
              >
                (Correct Score)
              </span>
            </p>

            <div
              dir="ltr"
              className="mt-3"
            >
              <strong className="bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
                {mostLikelyScore.score}
              </strong>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              الاحتمال{" "}
              <strong className="text-cyan-300">
                {formatPercent(mostLikelyScore.probability)}
              </strong>
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              لا تمثل هذه النتيجة وحدها الاحتمال الإجمالي للفائز.
            </p>

            <div className="mt-7 grid gap-2">
              <ProbabilityItem
                label={`فوز ${homeTeam.name}`}
                value={probabilities.homeWin}
                accentClass="font-black text-cyan-300"
              />

              <ProbabilityItem
                label="التعادل"
                value={probabilities.draw}
                accentClass="font-black text-slate-200"
              />

              <ProbabilityItem
                label={`فوز ${awayTeam.name}`}
                value={probabilities.awayWin}
                accentClass="font-black text-violet-300"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
              <span className="text-xs text-slate-500">
                إجمالي الأهداف المتوقعة
              </span>

              <strong className="mr-2 text-xl font-black text-white">
                {(
                  expectedGoals.total ??
                  expectedGoals.home + expectedGoals.away
                ).toFixed(2)}
              </strong>
            </div>
          </div>

          <TeamPanel
            team={awayTeam}
            label="الفريق الضيف"
            expectedGoals={expectedGoals.away}
            alignment="left"
          />
        </div>
      </div>
    </section>
  );
}






