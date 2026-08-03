import Link from "next/link";

import {
  confidenceClasses,
  formatDate,
  statusClasses,
  translatePick,
  translateStatus,
} from "./helpers";
import TeamLogo from "./TeamLogo";
import type { DashboardFixture } from "./types";

export default function FixtureCard({
  fixture,
}: {
  fixture: DashboardFixture;
}) {
  return (
    <article className="w-full rounded-[28px] border border-slate-800 bg-[#071023] p-6 transition duration-200 hover:-translate-y-1 hover:border-cyan-500/40">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
            fixture.status,
          )}`}
        >
          {translateStatus(fixture.status)}
        </span>

        <span className="text-xs text-slate-500">
          المباراة #{fixture.id}
        </span>
      </div>

      <div
        dir="ltr"
        className="mt-7 grid grid-cols-[1fr_auto_1fr] items-start gap-4"
      >
        <div className="flex min-w-0 flex-col items-center text-center">
          <TeamLogo team={fixture.homeTeam} />

          <h3 className="mt-3 line-clamp-2 font-black">
            {fixture.homeTeam.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Home Team
          </p>

          {fixture.homeTeam.country && (
            <p className="mt-1 text-xs text-slate-600">
              {fixture.homeTeam.country}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-black text-violet-300">
          VS
        </div>

        <div className="flex min-w-0 flex-col items-center text-center">
          <TeamLogo team={fixture.awayTeam} />

          <h3 className="mt-3 line-clamp-2 font-black">
            {fixture.awayTeam.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Away Team
          </p>

          {fixture.awayTeam.country && (
            <p className="mt-1 text-xs text-slate-600">
              {fixture.awayTeam.country}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
        <p className="text-sm text-slate-400">
          {formatDate(fixture.date)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-3 text-center">
          <p className="text-xs text-slate-500">
            النتيجة المتوقعة
          </p>

          <p className="mt-1 text-xl font-black text-violet-300">
            {fixture.predictedScore ?? "—"}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-center">
          <p className="text-xs text-slate-500">
            مؤشر الثقة
          </p>

          <p
            className={`mt-1 text-xl font-black ${confidenceClasses(
              fixture.confidence?.score,
            )}`}
          >
            {fixture.confidence?.score ?? 0}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-4">
        <p className="text-xs text-slate-500">
          أفضل توقع
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <strong className="text-cyan-300">
            {translatePick(fixture)}
          </strong>

          <span className="text-xl font-black text-cyan-300">
            {fixture.bestPick?.probability.toFixed(2) ??
              "0.00"}
            %
          </span>
        </div>
      </div>

      <Link
        href={`/matches/${fixture.id}`}
        className="mt-5 block rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-5 py-3 text-center font-black transition hover:opacity-90"
      >
        عرض تحليل المباراة
      </Link>
    </article>
  );
}
