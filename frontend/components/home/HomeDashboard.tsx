"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";

import AdBanner from "./AdBanner";
import AdSlider from "./AdSlider";
import AIInsights from "./AIInsights";
import { confidenceClasses, normalizeStatus } from "./helpers";
import MatchExplorer from "./MatchExplorer";
import PredictionResultsTicker from "./PredictionResultsTicker";
import StatCard from "./StatCard";
import TopPickCard from "./TopPickCard";
import type { HomeDashboardProps } from "./types";

export type {
  DashboardFixture,
  DashboardTeam,
} from "./types";

export default function HomeDashboard({
  fixtures,
  explorerFixtures,
  modelVersion,
}: HomeDashboardProps) {
  const { user } = useAuth();
  const { locale } = useLocale();

  const isAdmin = user?.role === "admin";

  const t =
    locale === "ar"
      ? {
          heroTitle: "لوحة تحليل مباريات كرة القدم",
          heroDescription:
            "البحث عن المباريات، ترتيب التوقعات، ومراجعة أفضل اختيارات محرك الذكاء الاصطناعي.",
          allMatches: "جميع المباريات",
          adminPanel: "لوحة الإدارة",
          ad: "إعلان",
          availableMatches: "المباريات المتاحة",
          availableMatchesSubtitle: "إجمالي المباريات القادمة",
          scheduledMatches: "المباريات المجدولة",
          scheduledMatchesSubtitle: "{t.scheduledMatchesSubtitle}",
          liveMatches: "المباريات المباشرة",
          liveMatchesSubtitle: "المباريات الجارية حاليًا",
          averageConfidence: "متوسط الثقة",
          averageConfidenceSubtitle:
            "متوسط ثقة التوقعات المتاحة",
          topPicks: "أفضل توقعات الذكاء الاصطناعي",
          topPicksDescription:
            "مرتبة وفق أعلى نسبة لأفضل اختيار في كل مباراة.",
          noPredictions:
            "لا توجد توقعات متاحة حاليًا.",
        }
      : locale === "sv"
        ? {
            heroTitle: "Analys av fotbollsmatcher",
            heroDescription:
              "Sök bland matcher, rangordna prognoser och granska AI-motorns bästa val.",
            allMatches: "Alla matcher",
            adminPanel: "Adminpanel",
            ad: "Annons",
            availableMatches: "Tillgängliga matcher",
            availableMatchesSubtitle:
              "Totalt antal kommande matcher",
            scheduledMatches:
              "Schemalagda matcher",
            scheduledMatchesSubtitle:
              "Kommande matcher",
            liveMatches: "Livematcher",
            liveMatchesSubtitle:
              "Matcher som spelas just nu",
            averageConfidence:
              "Genomsnittlig säkerhet",
            averageConfidenceSubtitle:
              "Genomsnittlig säkerhet för tillgängliga prognoser",
            topPicks: "AI:s bästa prognoser",
            topPicksDescription:
              "Rangordnade efter den högsta sannolikheten för det bästa valet i varje match.",
            noPredictions:
              "Inga prognoser är tillgängliga just nu.",
          }
        : {
            heroTitle: "Football Match Analysis",
            heroDescription:
              "Search matches, rank predictions and review the AI engine's best picks.",
            allMatches: "All Matches",
            adminPanel: "Admin Panel",
            ad: "Advertisement",
            availableMatches:
              "Available Matches",
            availableMatchesSubtitle:
              "Total upcoming matches",
            scheduledMatches:
              "Scheduled Matches",
            scheduledMatchesSubtitle:
              "Upcoming matches",
            liveMatches: "Live Matches",
            liveMatchesSubtitle:
              "Matches currently in progress",
            averageConfidence:
              "Average Confidence",
            averageConfidenceSubtitle:
              "Average confidence of available predictions",
            topPicks: "Top AI Predictions",
            topPicksDescription:
              "Ranked by the highest probability of the best pick in each match.",
            noPredictions:
              "No predictions are currently available.",
          };

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
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <header className="rounded-xl border border-cyan-500/20 bg-gradient-to-l from-cyan-950/30 via-slate-950 to-violet-950/30 p-3 sm:rounded-[28px] sm:p-7 lg:rounded-[32px] lg:p-10">
          <nav className="flex flex-col items-stretch justify-between gap-3 sm:gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[9px] font-bold tracking-[0.14em] text-cyan-400 sm:text-sm sm:tracking-[0.2em]">
                FOOTBALL ANALYSIS AI
              </p>

              <h1 className="mt-1.5 text-xl font-black leading-tight sm:mt-3 sm:text-4xl lg:text-5xl">
                {t.heroTitle}
              </h1>

              <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400 sm:mt-4 sm:text-base sm:leading-8">
                {t.heroDescription}
              </p>
            </div>

            <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                href="/fixtures"
                className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-center text-xs font-black text-slate-950 transition hover:bg-cyan-400 sm:w-auto sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
              >
                {t.allMatches}
              </Link>

              {isAdmin ? (
                <Link
                  href="/admin"
                  className="w-full rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-bold transition hover:border-violet-400 sm:w-auto sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
                >
                  {t.adminPanel}
                </Link>
              ) : null}
            </div>
          </nav>

          <PredictionResultsTicker />
        </header>

        <AdSlider />

        <AdBanner
          href="https://example.com"
          imageUrl="/ads/home-banner.jpg"
          alt={t.ad}
        />

        <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-5 lg:grid-cols-4">
          <StatCard
            title={t.availableMatches}
            value={fixtures.length}
            subtitle={t.availableMatchesSubtitle}
            valueClassName="text-cyan-300"
          />

          <StatCard
            title={t.scheduledMatches}
            value={scheduledMatches}
            subtitle={t.scheduledMatchesSubtitle}
            valueClassName="text-violet-300"
          />

          <StatCard
            title={t.liveMatches}
            value={liveMatches}
            subtitle={t.liveMatchesSubtitle}
            valueClassName="text-red-300"
          />

          <StatCard
            title={t.averageConfidence}
            value={`${averageConfidence}%`}
            subtitle={t.averageConfidenceSubtitle}
            valueClassName={confidenceClasses(
              averageConfidence,
            )}
          />
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
              TOP AI PICKS
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {t.topPicks}
            </h2>

            <p className="mt-2 text-slate-500">
              {t.topPicksDescription}
            </p>
          </div>

          {topPicks.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-7 text-slate-400">
              {t.noPredictions}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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

        <section className="mt-8 sm:mt-12">
          <AIInsights fixtures={fixtures} />
        </section>

        <section className="mt-8 sm:mt-12">
          <MatchExplorer fixtures={explorerFixtures} />
        </section>

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI
        </footer>
      </div>
    </main>
  );
}









