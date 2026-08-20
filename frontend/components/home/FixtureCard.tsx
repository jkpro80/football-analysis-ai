"use client";

import Link from "next/link";

import FavoriteButton from "@/components/favorites/FavoriteButton";
import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

import {
  statusClasses,
} from "./helpers";
import TeamLogo from "./TeamLogo";
import type { DashboardFixture } from "./types";

function getText(locale: Locale) {
  if (locale === "ar") {
    return {
      viewAnalysis: "عرض التحليل",
      unknownStatus: "غير محددة",
      statuses: {
        scheduled: "مجدولة",
        live: "مباشرة",
        finished: "منتهية",
        postponed: "مؤجلة",
        cancelled: "ملغاة",
      } as Record<string, string>,
    };
  }

  if (locale === "sv") {
    return {
      viewAnalysis: "Visa analys",
      unknownStatus: "Okänd",
      statuses: {
        scheduled: "Schemalagd",
        live: "Live",
        finished: "Avslutad",
        postponed: "Uppskjuten",
        cancelled: "Inställd",
      } as Record<string, string>,
    };
  }

  return {
    viewAnalysis: "View analysis",
    unknownStatus: "Unknown",
    statuses: {
      scheduled: "Scheduled",
      live: "Live",
      finished: "Finished",
      postponed: "Postponed",
      cancelled: "Cancelled",
    } as Record<string, string>,
  };
}

function localizedStatus(
  status: string | undefined,
  locale: Locale,
): string {
  const t = getText(locale);

  if (!status) {
    return t.unknownStatus;
  }

  return (
    t.statuses[
      status.toLowerCase()
    ] ?? status
  );
}

export default function FixtureCard({
  fixture,
  showFavoriteAction = true,
}: {
  fixture: DashboardFixture;
  showFavoriteAction?: boolean;
}) {
  const {
    locale,
    direction,
  } = useLocale();

  const t = getText(locale);

  return (
    <article
      dir={direction}
      className="flex h-full min-h-[270px] w-full flex-col rounded-2xl border border-slate-800 bg-[#071023] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses(
            fixture.status,
          )}`}
        >
          {localizedStatus(
            fixture.status,
            locale,
          )}
        </span>

        <span className="text-[10px] font-medium text-slate-500">
          #{fixture.id}
        </span>
      </div>

      <div
        dir="ltr"
        className="mt-3 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2"
      >
        <div className="flex min-w-0 flex-col items-center justify-center text-center">
          <div className="origin-center scale-[0.78]">
            <TeamLogo
              team={fixture.homeTeam}
            />
          </div>

          <h3 className="mt-0.5 line-clamp-2 min-h-[36px] text-[13px] font-black leading-[18px] text-white">
            {fixture.homeTeam.name}
          </h3>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-[11px] font-black text-violet-300">
          VS
        </div>

        <div className="flex min-w-0 flex-col items-center justify-center text-center">
          <div className="origin-center scale-[0.78]">
            <TeamLogo
              team={fixture.awayTeam}
            />
          </div>

          <h3 className="mt-0.5 line-clamp-2 min-h-[36px] text-[13px] font-black leading-[18px] text-white">
            {fixture.awayTeam.name}
          </h3>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Link
          href={`/matches/${fixture.id}`}
          className="block rounded-lg bg-gradient-to-l from-cyan-500 to-blue-600 px-3 py-2.5 text-center text-sm font-black text-white transition hover:opacity-90"
        >
          {t.viewAnalysis}
        </Link>

        {showFavoriteAction ? (
          <FavoriteButton
            matchId={Number(
              fixture.id,
            )}
          />
        ) : null}
      </div>
    </article>
  );
}
