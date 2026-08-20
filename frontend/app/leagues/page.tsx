import FixtureCard from "@/components/home/FixtureCard";
import { getDashboardData } from "@/lib/dashboard";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const LEAGUES_PAGE_TEXT = {
  ar: {
    eyebrow: "مركز الدوريات",
    title: "الدوريات والبطولات",
    description:
      "استعراض البطولات المتاحة وفق بيانات المباريات الحالية، مع عدد الفرق والمباريات ومتوسط ثقة المحرك.",

    availableLeagues: "البطولات المتاحة",
    availableLeaguesNote: "دول وبطولات ممثلة في البيانات",

    totalTeams: "إجمالي الفرق",
    totalTeamsNote: "فرق مختلفة في المنصة",

    totalMatches: "إجمالي المباريات",
    totalMatchesNote: "مباريات متاحة للتحليل",

    largestLeague: "البطولة الأكبر",
    noData: "لا توجد بيانات",

    availableSectionEyebrow: "البطولات المتاحة",
    allLeagues: "جميع البطولات",
    allLeaguesDescription:
      "ترتيب البطولات حسب عدد المباريات المتاحة.",
    noLeagues: "لا توجد بيانات بطولات متاحة حاليًا.",

    league: "البطولة",
    teams: "الفرق",
    averageConfidence: "متوسط الثقة",

    matchCount: (count: number) =>
      `${count} مباراة`,

    leagueDescription: (
      matches: number,
      teams: number,
    ) =>
      `تضم ${matches} مباراة و ${teams} فريقًا ضمن البيانات الحالية.`,

    featuredEyebrow: "مباريات مختارة",
    featuredTitle: "مباريات مختارة",
    featuredDescription:
      "أعلى المباريات ترتيبًا وفق ثقة المحرك.",
    noFeaturedMatches:
      "لا توجد مباريات متاحة حاليًا.",

    unknown: "غير معروف",
  },

  sv: {
    eyebrow: "LIGACENTER",
    title: "Ligor och turneringar",
    description:
      "Utforska tillgängliga ligor baserat på aktuella matchdata, med antal lag, matcher och motorns genomsnittliga säkerhet.",

    availableLeagues: "Tillgängliga ligor",
    availableLeaguesNote:
      "Länder och ligor representerade i datan",

    totalTeams: "Totalt antal lag",
    totalTeamsNote: "Olika lag på plattformen",

    totalMatches: "Totalt antal matcher",
    totalMatchesNote:
      "Matcher tillgängliga för analys",

    largestLeague: "Största ligan",
    noData: "Ingen data tillgänglig",

    availableSectionEyebrow:
      "TILLGÄNGLIGA LIGOR",
    allLeagues: "Alla ligor",
    allLeaguesDescription:
      "Ligor rangordnade efter antal tillgängliga matcher.",
    noLeagues:
      "Det finns inga ligadata tillgängliga just nu.",

    league: "LIGA",
    teams: "Lag",
    averageConfidence:
      "Genomsnittlig säkerhet",

    matchCount: (count: number) =>
      `${count} ${count === 1 ? "match" : "matcher"}`,

    leagueDescription: (
      matches: number,
      teams: number,
    ) =>
      `Innehåller ${matches} ${matches === 1 ? "match" : "matcher"} och ${teams} lag i aktuell data.`,

    featuredEyebrow: "UTVALDA MATCHER",
    featuredTitle: "Utvalda matcher",
    featuredDescription:
      "De högst rankade matcherna baserat på motorns säkerhet.",
    noFeaturedMatches:
      "Det finns inga matcher tillgängliga just nu.",

    unknown: "Okänd",
  },

  en: {
    eyebrow: "LEAGUES CENTER",
    title: "Leagues & Competitions",
    description:
      "Explore available leagues based on current match data, including teams, matches and the engine's average confidence.",

    availableLeagues: "Available Leagues",
    availableLeaguesNote:
      "Countries and leagues represented in the data",

    totalTeams: "Total Teams",
    totalTeamsNote:
      "Different teams on the platform",

    totalMatches: "Total Matches",
    totalMatchesNote:
      "Matches available for analysis",

    largestLeague: "Largest League",
    noData: "No data available",

    availableSectionEyebrow:
      "AVAILABLE LEAGUES",
    allLeagues: "All Leagues",
    allLeaguesDescription:
      "Leagues ranked by the number of available matches.",
    noLeagues:
      "No league data is currently available.",

    league: "LEAGUE",
    teams: "Teams",
    averageConfidence:
      "Average Confidence",

    matchCount: (count: number) =>
      `${count} ${count === 1 ? "match" : "matches"}`,

    leagueDescription: (
      matches: number,
      teams: number,
    ) =>
      `Includes ${matches} ${matches === 1 ? "match" : "matches"} and ${teams} ${teams === 1 ? "team" : "teams"} in the current data.`,

    featuredEyebrow: "FEATURED MATCHES",
    featuredTitle: "Featured Matches",
    featuredDescription:
      "The highest-ranked matches based on engine confidence.",
    noFeaturedMatches:
      "No matches are currently available.",

    unknown: "Unknown",
  },
} as const;

type LeagueSummary = {
  name: string;
  matches: number;
  teams: Set<string>;
  totalConfidence: number;
  confidenceCount: number;
};

export default async function LeaguesPage() {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = LEAGUES_PAGE_TEXT[locale];

  const { fixtures } =
    await getDashboardData();

  const leaguesMap =
    new Map<string, LeagueSummary>();

  for (const fixture of fixtures) {
    const homeCountry =
      fixture.homeTeam.country?.trim() ||
      text.unknown;

    const awayCountry =
      fixture.awayTeam.country?.trim() ||
      text.unknown;

    const countries = new Set([
      homeCountry,
      awayCountry,
    ]);

    for (const country of countries) {
      const current =
        leaguesMap.get(country) ?? {
          name: country,
          matches: 0,
          teams: new Set<string>(),
          totalConfidence: 0,
          confidenceCount: 0,
        };

      current.matches += 1;
      current.teams.add(
        fixture.homeTeam.name,
      );
      current.teams.add(
        fixture.awayTeam.name,
      );

      if (
        fixture.confidence?.score !== undefined
      ) {
        current.totalConfidence +=
          fixture.confidence.score;

        current.confidenceCount += 1;
      }

      leaguesMap.set(
        country,
        current,
      );
    }
  }

  const leagues = [
    ...leaguesMap.values(),
  ]
    .map((league) => ({
      name: league.name,
      matches: league.matches,
      teams: league.teams.size,

      averageConfidence:
        league.confidenceCount > 0
          ? Math.round(
              league.totalConfidence /
                league.confidenceCount,
            )
          : 0,
    }))
    .sort(
      (first, second) =>
        second.matches -
        first.matches,
    );

  const totalTeams = new Set(
    fixtures.flatMap((fixture) => [
      fixture.homeTeam.name,
      fixture.awayTeam.name,
    ]),
  ).size;

  const largestLeague =
    leagues.length > 0
      ? leagues[0]
      : null;

  const featuredFixtures = [
    ...fixtures,
  ]
    .sort(
      (first, second) =>
        (second.confidence?.score ?? 0) -
        (first.confidence?.score ?? 0),
    )
    .slice(0, 6);

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-amber-500/20 bg-gradient-to-l from-amber-950/25 via-slate-950 to-cyan-950/20 p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-amber-400">
            {text.eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            {text.title}
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            {text.description}
          </p>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.availableLeagues}
            </p>

            <p className="mt-3 text-4xl font-black text-amber-300">
              {leagues.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.availableLeaguesNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.totalTeams}
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {totalTeams}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.totalTeamsNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.totalMatches}
            </p>

            <p className="mt-3 text-4xl font-black text-violet-300">
              {fixtures.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.totalMatchesNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.largestLeague}
            </p>

            <p className="mt-3 text-2xl font-black text-emerald-300">
              {largestLeague?.name ?? "—"}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {largestLeague
                ? text.matchCount(
                    largestLeague.matches,
                  )
                : text.noData}
            </p>
          </article>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-amber-400">
              {text.availableSectionEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.allLeagues}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.allLeaguesDescription}
            </p>
          </div>

          {leagues.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              {text.noLeagues}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {leagues.map(
                (league, index) => (
                  <article
                    key={league.name}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 transition hover:border-amber-500/35"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black tracking-[0.18em] text-amber-400">
                          {text.league} #
                          {index + 1}
                        </p>

                        <h3 className="mt-3 text-2xl font-black">
                          {league.name}
                        </h3>
                      </div>

                      <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-sm font-black text-amber-300">
                        {league.matches}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-[#071023] p-4">
                        <p className="text-xs text-slate-500">
                          {text.teams}
                        </p>

                        <p className="mt-2 text-2xl font-black text-cyan-300">
                          {league.teams}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-[#071023] p-4">
                        <p className="text-xs text-slate-500">
                          {text.averageConfidence}
                        </p>

                        <p className="mt-2 text-2xl font-black text-violet-300">
                          {league.averageConfidence}
                          %
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-500">
                      {text.leagueDescription(
                        league.matches,
                        league.teams,
                      )}
                    </p>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
              {text.featuredEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.featuredTitle}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.featuredDescription}
            </p>
          </div>

          {featuredFixtures.length ===
          0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              {text.noFeaturedMatches}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredFixtures.map(
                (fixture) => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                  />
                ),
              )}
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
