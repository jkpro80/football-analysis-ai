"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

import {
  confidenceClasses,
  confidenceLabel,
  translatePick,
} from "./helpers";
import type { DashboardFixture } from "./types";

export default function TopPickCard({
  fixture,
  rank,
}: {
  fixture: DashboardFixture;
  rank: number;
}) {
  const {
    locale,
    direction,
  } = useLocale();

  const t =
    locale === "ar"
      ? {
          pickNumber: (rank: number) =>
            `الاختيار رقم ${rank}`,
          bestPrediction: "أفضل توقع",
          confidence: "الثقة",
          openAnalysis: "فتح التحليل",
        }
      : locale === "sv"
        ? {
            pickNumber: (rank: number) =>
              `Val nummer ${rank}`,
            bestPrediction: "Bästa prognos",
            confidence: "Säkerhet",
            openAnalysis: "Öppna analys",
          }
        : {
            pickNumber: (rank: number) =>
              `Pick #${rank}`,
            bestPrediction: "Best Prediction",
            confidence: "Confidence",
            openAnalysis: "Open Analysis",
          };

  return (
    <article dir={direction} className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-950 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
            {t.pickNumber(rank)}
          </span>

          <h3 className="mt-4 text-xl font-black">
            {fixture.homeTeam.name}
            {" × "}
            {fixture.awayTeam.name}
          </h3>
        </div>

        <span className="text-sm text-slate-500">
          #{fixture.id}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-slate-950/50 p-4">
        <p className="text-xs text-slate-500">
          {t.bestPrediction}
        </p>

        <div className="mt-2 flex items-center justify-between gap-4">
          <strong className="text-lg text-emerald-300">
            {translatePick(fixture, locale)}
          </strong>

          <span className="text-3xl font-black text-emerald-300">
            {fixture.bestPick?.probability.toFixed(2) ??
              "0.00"}
            %
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">{t.confidence}</span>

        <strong
          className={confidenceClasses(
            fixture.confidence?.score,
          )}
        >
          {fixture.confidence?.score ?? 0}% —{" "}
          {confidenceLabel(
            fixture.confidence?.score,
            locale,
          )}
        </strong>
      </div>

      <Link
        href={`/matches/${fixture.id}`}
        className="mt-5 block rounded-xl border border-emerald-500/30 px-4 py-3 text-center font-black text-emerald-300 transition hover:bg-emerald-500/10"
      >
        {t.openAnalysis}
      </Link>
    </article>
  );
}
