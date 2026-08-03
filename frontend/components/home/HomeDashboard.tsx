"use client";

import Link from "next/link";
import { useMemo } from "react";

import AIInsights from "./AIInsights";
import { confidenceClasses } from "./helpers";
import MatchExplorer from "./MatchExplorer";
import StatCard from "./StatCard";
import TopPickCard from "./TopPickCard";
import type { HomeDashboardProps } from "./types";

export type {
  DashboardFixture,
  DashboardTeam,
} from "./types";

export default function HomeDashboard({
  fixtures,
  modelVersion,
}: HomeDashboardProps) {
  const topPicks = useMemo(() => {
    return [...fixtures]
      .filter(
        (fixture) =>
          fixture.bestPick !== undefined,
      )
      .sort(
        (first, second) =>
          (second.bestPick?.probability ?? 0) -
          (first.bestPick?.probability ?? 0),
      )
      .slice(0, 3);
  }, [fixtures]);

  const normalizeStatus = (
    status: string | undefined,
  ): "scheduled" | "live" | "finished" | "other" => {
    const normalized = String(status ?? "")
      .trim()
      .toLowerCase();

    if (
      ["1", "2", "scheduled", "not_started", "pending"].includes(
        normalized,
      )
    ) {
      return "scheduled";
    }

    if (
      [
        "3",
        "4",
        "live",
        "inplay",
        "in-play",
        "halftime",
        "ht",
      ].includes(normalized)
    ) {
      return "live";
    }

    if (
      [
        "5",
        "8",
        "9",
        "10",
        "finished",
        "completed",
        "ft",
      ].includes(normalized)
    ) {
      return "finished";
    }

    return "other";
  };

  const liveMatches = fixtures.filter(
    (fixture) =>
      normalizeStatus(fixture.status) === "live",
  ).length;

  const scheduledMatches = fixtures.filter(
    (fixture) =>
      normalizeStatus(fixture.status) === "scheduled",
  ).length;

  const averageConfidence =
    fixtures.length > 0
      ? Math.round(
          fixtures.reduce(
            (total, fixture) =>
              total +
              (fixture.confidence?.score ?? 0),
            0,
          ) / fixtures.length,
        )
      : 0;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-l from-cyan-950/30 via-slate-950 to-violet-950/30 p-7 sm:p-10">
          <nav className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
                FOOTBALL ANALYSIS AI
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                لوحة تحليل مباريات كرة القدم
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                البحث عن المباريات، ترتيب التوقعات،
                ومراجعة أفضل اختيارات محرك الذكاء
                الاصطناعي.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/fixtures"
                className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                جميع المباريات
              </Link>

              <Link
                href="/admin"
                className="rounded-xl border border-slate-700 px-5 py-3 font-bold transition hover:border-violet-400"
              >
                لوحة الإدارة
              </Link>
            </div>
          </nav>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="المباريات المتاحة"
            value={fixtures.length}
            subtitle="إجمالي المباريات القادمة"
            valueClassName="text-cyan-300"
          />

          <StatCard
            title="المباريات المجدولة"
            value={scheduledMatches}
            subtitle="المباريات القادمة"
            valueClassName="text-violet-300"
          />

          <StatCard
            title="المباريات المباشرة"
            value={liveMatches}
            subtitle="المباريات الجارية حاليًا"
            valueClassName="text-red-300"
          />

          <StatCard
            title="متوسط الثقة"
            value={`${averageConfidence}%`}
            subtitle={modelVersion}
            valueClassName={confidenceClasses(
              averageConfidence,
            )}
          />
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
              TOP AI PICKS
            </p>

            <h2 className="mt-2 text-3xl font-black">
              أفضل توقعات الذكاء الاصطناعي
            </h2>

            <p className="mt-2 text-slate-500">
              مرتبة وفق أعلى نسبة لأفضل اختيار في كل
              مباراة.
            </p>
          </div>

          {topPicks.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-7 text-slate-400">
              لا توجد توقعات متاحة حاليًا.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {topPicks.map((fixture, index) => (
                <TopPickCard
                  key={fixture.id}
                  fixture={fixture}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <AIInsights fixtures={fixtures} />
        </section>

        <section className="mt-12">
          <MatchExplorer fixtures={fixtures} />
        </section>

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI — {modelVersion}
        </footer>
      </div>
    </main>
  );
}

