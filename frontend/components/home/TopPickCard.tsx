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
    <article dir={direction} className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-950 p-3 sm:rounded-3xl sm:p-6">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black text-emerald-300 sm:px-3 sm:py-1 sm:text-xs">
            {t.pickNumber(rank)}
          </span>

          <h3 className="mt-2 text-sm font-black leading-5 sm:mt-4 sm:text-xl">
            {fixture.homeTeam.name}
            {" × "}
            {fixture.awayTeam.name}
          </h3>
        </div>

        <span className="text-[10px] text-slate-500 sm:text-sm">
          #{fixture.id}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-slate-950/50 p-2.5 sm:mt-6 sm:rounded-2xl sm:p-4">
        <p className="text-[9px] text-slate-500 sm:text-xs">
          {t.bestPrediction}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2 sm:mt-2 sm:gap-4">
          <strong className="text-xs font-black text-emerald-300 sm:text-lg">
            {translatePick(fixture, locale)}
          </strong>

          <span className="text-xl font-black text-emerald-300 sm:text-3xl">
            {fixture.bestPick?.probability.toFixed(2) ??
              "0.00"}
            %
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] sm:mt-4 sm:text-sm">
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
        className="mt-2.5 block rounded-lg border border-emerald-500/30 px-3 py-1.5 text-center text-[11px] font-black text-emerald-300 transition hover:bg-emerald-500/10 sm:mt-5 sm:rounded-xl sm:px-4 sm:py-3 sm:text-base"
      >
        {t.openAnalysis}
      </Link>
    </article>
  );
}

