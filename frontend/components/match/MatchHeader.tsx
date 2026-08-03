import TeamDisplay from "@/components/match/TeamDisplay";
import type { PredictionResponse } from "@/types/prediction";

type MatchHeaderProps = {
  data: PredictionResponse;
};

function formatMatchDate(dateValue: string) {
  const normalizedDate = dateValue.includes("T")
    ? dateValue
    : dateValue.replace(" ", "T");

  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function percent(value: number) {
  return `${value.toFixed(2)}%`;
}

export default function MatchHeader({
  data,
}: MatchHeaderProps) {
  const homeTeam = data.match.home_team;
  const awayTeam = data.match.away_team;

  return (
    <section className="overflow-hidden rounded-[36px] border border-slate-800 bg-[#050b1e] shadow-2xl shadow-black/30">
      <div className="border-b border-slate-800 bg-gradient-to-l from-cyan-950/25 via-slate-950/20 to-violet-950/25 px-6 py-6 sm:px-9">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black tracking-[0.3em] text-cyan-400">
              MATCH ANALYSIS
            </p>

            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              تحليل المباراة
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              {formatMatchDate(data.match.date)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {data.match.competition && (
              <span className="rounded-2xl border border-violet-500/25 bg-violet-500/10 px-5 py-3 text-sm font-bold text-violet-300">
                {data.match.competition}
              </span>
            )}

            <span className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-300">
              {data.engine.name}
            </span>

            <span className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm text-slate-300">
              V{data.engine.version}
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-6 py-10 sm:px-10 lg:py-14">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
          <TeamDisplay
            team={homeTeam}
            side="HOME"
            expectedGoals={data.expected_goals.home}
          />

          <div className="mx-auto w-full max-w-xs text-center">
            <span className="inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/10 px-5 py-2 text-xs font-bold text-cyan-300">
              المباراة رقم {data.match.id}
            </span>

            <p className="mt-7 text-xs font-bold tracking-wider text-slate-500">
              النتيجة الأكثر احتمالًا
            </p>

            <div className="mt-2 text-7xl font-black tracking-tight text-white sm:text-8xl">
              {data.most_likely_score.score}
            </div>

            <p className="mt-3 text-sm text-slate-500">
              الاحتمال{" "}
              <strong className="text-cyan-300">
                {percent(data.most_likely_score.probability)}
              </strong>
            </p>

            <div className="mt-7 grid grid-cols-3 gap-2 rounded-3xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-[11px] text-slate-500">فوز المضيف</p>
                <p className="mt-1 font-black text-cyan-300">
                  {percent(data.prediction.home_win)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-[11px] text-slate-500">التعادل</p>
                <p className="mt-1 font-black text-slate-200">
                  {percent(data.prediction.draw)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-[11px] text-slate-500">فوز الضيف</p>
                <p className="mt-1 font-black text-violet-300">
                  {percent(data.prediction.away_win)}
                </p>
              </div>
            </div>

            {data.match.venue && (
              <p className="mt-5 text-xs text-slate-500">
                الملعب: {data.match.venue}
              </p>
            )}
          </div>

          <TeamDisplay
            team={awayTeam}
            side="AWAY"
            expectedGoals={data.expected_goals.away}
          />
        </div>
      </div>
    </section>
  );
}
