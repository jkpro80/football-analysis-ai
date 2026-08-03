import type { Prediction } from "@/types/prediction";

type Props = {
  predictions: Prediction[];
};

function translatePick(
  key: string | null | undefined,
): string {
  if (!key) return "غير متوفر";

  const labels: Record<string, string> = {
    home_win: "فوز صاحب الأرض",
    away_win: "فوز الفريق الضيف",
    draw: "تعادل",
  };

  return labels[key] ?? key;
}

function translateConfidence(label: string): string {
  const labels: Record<string, string> = {
    very_high: "عالية جدًا",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return labels[label] ?? label;
}

function confidenceClasses(label: string): string {
  if (label === "very_high" || label === "high") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (label === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function probabilityWidth(
  value: number | null | undefined,
): string {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value ?? 0)),
  );

  return `${safeValue}%`;
}

function TeamLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`شعار ${name}`}
        loading="lazy"
        className="h-11 w-11 rounded-xl border border-slate-700 bg-white object-contain p-1.5"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sm font-black text-slate-300">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TopPicks({
  predictions,
}: Props) {
  const top = [...predictions]
    .sort(
      (a, b) =>
        (b.best_pick.probability ?? 0) -
        (a.best_pick.probability ?? 0),
    )
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            ⭐ أفضل التوقعات
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            أعلى الاختيارات حسب نسبة النموذج
          </p>
        </div>

        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          Top 5
        </span>
      </div>

      {top.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center">
          <p className="text-sm text-slate-400">
            لا توجد توقعات متاحة حاليًا.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {top.map((match, index) => (
            <article
              key={match.prediction_record_id}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-cyan-500/40 hover:bg-slate-950/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-black text-cyan-300">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <TeamLogo
                        name={match.teams.home.name}
                        logoUrl={
                          match.teams.home.logo_url ??
                          match.teams.home.logo ??
                          null
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">
                          {match.teams.home.name}
                        </p>

                        <p className="my-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                          VS
                        </p>

                        <p className="truncate text-sm font-bold text-white">
                          {match.teams.away.name}
                        </p>
                      </div>

                      <TeamLogo
                        name={match.teams.away.name}
                        logoUrl={
                          match.teams.away.logo_url ??
                          match.teams.away.logo ??
                          null
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-left">
                  <p className="text-2xl font-black text-cyan-400">
                    {(match.best_pick.probability ?? 0).toFixed(1)}%
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {match.predicted_score}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-slate-500">
                    أفضل اختيار
                  </p>

                  <p className="mt-1 text-sm font-bold text-cyan-300">
                    {translatePick(match.best_pick.key)}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClasses(
                    match.confidence.label,
                  )}`}
                >
                  الثقة:{" "}
                  {translateConfidence(match.confidence.label)}{" "}
                  {match.confidence.score ?? 0}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all"
                  style={{
                    width: probabilityWidth(
                      match.best_pick.probability,
                    ),
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}