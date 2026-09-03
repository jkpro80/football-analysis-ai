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
  matchStats,
  upcomingHasMore,
  upcomingNextOffset,
}: HomeDashboardProps) {
  const { user } = useAuth();
  const { locale } = useLocale();

  const isAdmin = user?.role === "admin";

  const t =
    locale === "ar"
      ? {
          heroTitle: "ذكاء كرة القدم يبدأ من Målx",
          heroDescription:
            "البحث عن المباريات، ترتيب التوقعات، ومراجعة أفضل اختيارات محرك الذكاء الاصطناعي.",
          allMatches: "جميع المباريات",
          adminPanel: "لوحة الإدارة",
          ad: "إعلان",
          availableMatches: "المباريات المتاحة",
          availableMatchesSubtitle: "إجمالي المباريات القادمة",
          scheduledMatches: "المباريات المجدولة",
          scheduledMatchesSubtitle: "المباريات القادمة",
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


  const liveMatches = matchStats.live;

  const scheduledMatches = matchStats.scheduled;

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
      className="malx-home min-h-screen"
    >
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <header className="malx-home-surface relative overflow-hidden rounded-[22px] border border-cyan-400/20 bg-[#050d1d] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:rounded-[30px] sm:p-7 lg:rounded-[34px] lg:p-10">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_88%_82%,rgba(37,99,235,0.14),transparent_34%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:34px_34px]" />

          <nav className="relative z-10 flex flex-col items-stretch justify-between gap-3 sm:gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[9px] font-bold tracking-[0.14em] text-cyan-400 sm:text-sm sm:tracking-[0.2em]">
                MÅLX FOOTBALL ANALYTICS
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

          <div className="relative z-10"><PredictionResultsTicker /></div>
        </header>

        <AdSlider />

        <AdBanner
          href="https://example.com"
          imageUrl="/ads/home-banner.jpg"
          alt={t.ad}
        />

        <section className="malx-home-surface mt-4 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-5 lg:grid-cols-4">
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

        <section className="malx-home-surface mt-8 sm:mt-10">
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
        {/* HOME-LEAGUE-SELECTOR */}
        <section className="malx-home-surface mt-8 sm:mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-400">
                MÅLX LEAGUES
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                {locale === "ar"
                  ? "اختر الدوري"
                  : locale === "sv"
                    ? "Välj liga"
                    : "Choose a League"}
              </h2>
            </div>

            <Link
              href="/leagues"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              {locale === "ar"
                ? "كل الدوريات"
                : locale === "sv"
                  ? "Alla ligor"
                  : "All Leagues"}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Premier League", "ENG"],
              ["La Liga", "ESP"],
              ["Serie A", "ITA"],
              ["Bundesliga", "GER"],
              ["Ligue 1", "FRA"],
            ].map(([name, code]) => (
              <Link
                key={name}
                href={`/leagues?league=${encodeURIComponent(name)}#league-matches`}
                className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-slate-900"
              >
                <span className="text-[10px] font-black tracking-[0.18em] text-slate-500 group-hover:text-cyan-400">
                  {code}
                </span>

                <p className="mt-3 text-sm font-black text-white sm:text-base">
                  {name}
                </p>

                <p className="mt-2 text-xs font-bold text-slate-500 group-hover:text-cyan-300">
                  {locale === "ar"
                    ? "عرض المباريات"
                    : locale === "sv"
                      ? "Visa matcher"
                      : "View Matches"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="malx-home-surface mt-8 sm:mt-12">
          <AIInsights fixtures={fixtures} />
        </section>

        <section className="malx-home-surface mt-8 sm:mt-12">
          <MatchExplorer
            fixtures={explorerFixtures}
            initialHasMore={upcomingHasMore}
            initialNextOffset={upcomingNextOffset}
          />
        </section>

        <footer className="malx-home-surface mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Målx • Football Analytics
        </footer>
      </div>
    </main>
  );
}
