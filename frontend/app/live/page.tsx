import Link from "next/link";

import FixtureCard from "@/components/home/FixtureCard";
import type { DashboardFixture } from "@/components/home/types";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type MatchApiItem = {
  id: number;
  sportmonks_id?: number | null;

  home_team_id: number;
  away_team_id: number;

  home_team: string;
  away_team: string;

  home_logo?: string | null;
  away_logo?: string | null;

  home_country?: string | null;
  away_country?: string | null;

  date: string;
  status?: string | null;

  home_score?: number | null;
  away_score?: number | null;

  league_name?: string | null;
  league_logo?: string | null;
};

function normalizeStatus(
  status: string | null | undefined,
): "scheduled" | "live" | "finished" | "other" {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "1",
      "2",
      "ns",
      "scheduled",
      "not_started",
      "not-started",
      "pending",
    ].includes(normalized)
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
      "ht",
      "halftime",
      "1st_half",
      "2nd_half",
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
      "ft",
      "finished",
      "completed",
      "aet",
      "pen",
    ].includes(normalized)
  ) {
    return "finished";
  }

  return "other";
}

async function getMatches(): Promise<MatchApiItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const response = await fetch(
    `${apiUrl}/matches?limit=100`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load matches: ${response.status}`,
    );
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
}

function toDashboardFixture(
  match: MatchApiItem,
  locale: Locale,
): DashboardFixture {
  return {
    id: Number(match.id),

    date: match.date,

    status:
      normalizeStatus(match.status) === "live"
        ? "live"
        : normalizeStatus(match.status) === "scheduled"
          ? "scheduled"
          : match.status ?? undefined,

    homeTeam: {
      id: Number(match.home_team_id),
      name:
        match.home_team ||
        (locale === "sv"
          ? "Hemmalaget"
          : locale === "en"
            ? "Home Team"
            : "الفريق المضيف"),
      country:
        match.home_country ?? undefined,
      logo:
        match.home_logo ?? undefined,
    },

    awayTeam: {
      id: Number(match.away_team_id),
      name:
        match.away_team ||
        (locale === "sv"
          ? "Bortalaget"
          : locale === "en"
            ? "Away Team"
            : "الفريق الضيف"),
      country:
        match.away_country ?? undefined,
      logo:
        match.away_logo ?? undefined,
    },
  };
}

const LIVE_PAGE_TEXT = {
  ar: {
    heroEyebrow: "مركز المباريات المباشرة",
    title: "المباريات المباشرة",
    description:
      "متابعة المباريات الجارية حاليًا مع الوصول السريع إلى صفحة التحليل لكل مباراة.",
    allMatches: "جميع المباريات",

    liveNow: "مباشر الآن",
    liveCountNote: "مباريات جارية حاليًا",

    scheduledMatches: "المباريات المجدولة",
    upcomingMatchesNote: "مباريات قادمة",

    liveSectionEyebrow: "مباشر الآن",
    liveSectionTitle: "مباشر الآن",
    liveSectionDescription:
      "المباريات الجارية حاليًا في قاعدة البيانات.",

    noLiveMatches: "لا توجد مباريات مباشرة الآن",
    noLiveMatchesDescription:
      "ستظهر المباريات هنا تلقائيًا عندما تتغير حالتها إلى مباشر.",

    upcomingSectionEyebrow: "المباريات القادمة",
    upcomingSectionTitle: "المباريات القادمة",
    upcomingSectionDescription:
      "أقرب المباريات المجدولة المتاحة في المنصة.",

    noScheduledMatches:
      "لا توجد مباريات مجدولة حاليًا.",
  },

  en: {
    heroEyebrow: "LIVE MATCHES CENTER",
    title: "Live Matches",
    description:
      "Follow matches currently in progress with quick access to the analysis page for each match.",
    allMatches: "All Matches",

    liveNow: "Live Now",
    liveCountNote: "Matches currently in progress",

    scheduledMatches: "Scheduled Matches",
    upcomingMatchesNote: "Upcoming matches",

    liveSectionEyebrow: "LIVE NOW",
    liveSectionTitle: "Live Now",
    liveSectionDescription:
      "Matches currently live in the database.",

    noLiveMatches: "No live matches right now",
    noLiveMatchesDescription:
      "Matches will appear here automatically when their status changes to live.",

    upcomingSectionEyebrow: "UPCOMING MATCHES",
    upcomingSectionTitle: "Upcoming Matches",
    upcomingSectionDescription:
      "The nearest scheduled matches available on the platform.",

    noScheduledMatches:
      "No scheduled matches are currently available.",
  },

  sv: {
    heroEyebrow: "LIVE-MATCHCENTER",
    title: "Livematcher",
    description:
      "Följ matcher som pågår just nu och öppna snabbt analyssidan för varje match.",
    allMatches: "Alla matcher",

    liveNow: "Live nu",
    liveCountNote: "Matcher som pågår just nu",

    scheduledMatches: "Schemalagda matcher",
    upcomingMatchesNote: "Kommande matcher",

    liveSectionEyebrow: "LIVE NU",
    liveSectionTitle: "Live nu",
    liveSectionDescription:
      "Matcher som är live just nu i databasen.",

    noLiveMatches: "Inga livematcher just nu",
    noLiveMatchesDescription:
      "Matcher visas automatiskt här när deras status ändras till live.",

    upcomingSectionEyebrow: "KOMMANDE MATCHER",
    upcomingSectionTitle: "Kommande matcher",
    upcomingSectionDescription:
      "De närmaste schemalagda matcherna som finns på plattformen.",

    noScheduledMatches:
      "Det finns inga schemalagda matcher just nu.",
  },
} as const;
export default async function LivePage() {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = LIVE_PAGE_TEXT[locale];

  const matches = await getMatches();

  const now = Date.now();

  const liveMatches = matches
    .filter(
      (match) =>
        normalizeStatus(match.status) === "live",
    )
    .sort(
      (first, second) =>
        new Date(first.date).getTime() -
        new Date(second.date).getTime(),
    );

  const scheduledMatches = matches
    .filter((match) => {
      if (
        normalizeStatus(match.status) !==
        "scheduled"
      ) {
        return false;
      }

      const timestamp =
        new Date(match.date).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp >= now
      );
    })
    .sort(
      (first, second) =>
        new Date(first.date).getTime() -
        new Date(second.date).getTime(),
    );

  const liveFixtures =
    liveMatches.map((match) =>
      toDashboardFixture(match, locale),
    );

  const scheduledFixtures =
    scheduledMatches
      .slice(0, 6)
      .map((match) =>
        toDashboardFixture(match, locale),
      );

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-red-500/20 bg-gradient-to-l from-red-950/30 via-slate-950 to-orange-950/20 p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>

                <p className="text-sm font-bold tracking-[0.2em] text-red-400">
                  {text.heroEyebrow}
                </p>
              </div>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                {text.title}
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                {text.description}
              </p>
            </div>

            <Link
              href="/fixtures"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-black text-red-300 transition hover:bg-red-500/20"
            >
              {text.allMatches}
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.liveNow}
            </p>

            <p className="mt-3 text-4xl font-black text-red-300">
              {liveFixtures.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.liveCountNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.scheduledMatches}
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {scheduledMatches.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.upcomingMatchesNote}
            </p>
          </article>


        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-red-400">
              {text.liveSectionEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.liveNow}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.liveSectionDescription}
            </p>
          </div>

          {liveFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-slate-600" />

                <h3 className="text-xl font-black text-slate-200">
                  {text.noLiveMatches}
                </h3>
              </div>

              <p className="mt-3 text-slate-400">
                {text.noLiveMatchesDescription}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {liveFixtures.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
              {text.upcomingSectionEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.upcomingSectionTitle}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.upcomingSectionDescription}
            </p>
          </div>

          {scheduledFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              {text.noScheduledMatches}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {scheduledFixtures.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI
        </footer>
      </div>
    </main>
  );
}



