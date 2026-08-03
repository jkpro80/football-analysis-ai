import FixtureCard from "@/components/home/FixtureCard";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

type LeagueSummary = {
  name: string;
  matches: number;
  teams: Set<string>;
  totalConfidence: number;
  confidenceCount: number;
};

export default async function LeaguesPage() {
  const { fixtures, modelVersion } =
    await getDashboardData();

  const leaguesMap = new Map<string, LeagueSummary>();

  for (const fixture of fixtures) {
    const homeCountry =
      fixture.homeTeam.country?.trim() || "Unknown";

    const awayCountry =
      fixture.awayTeam.country?.trim() || "Unknown";

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
      current.teams.add(fixture.homeTeam.name);
      current.teams.add(fixture.awayTeam.name);

      if (fixture.confidence?.score !== undefined) {
        current.totalConfidence +=
          fixture.confidence.score;
        current.confidenceCount += 1;
      }

      leaguesMap.set(country, current);
    }
  }

  const leagues = [...leaguesMap.values()]
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
        second.matches - first.matches,
    );

  const totalTeams = new Set(
    fixtures.flatMap((fixture) => [
      fixture.homeTeam.name,
      fixture.awayTeam.name,
    ]),
  ).size;

  const largestLeague =
    leagues.length > 0 ? leagues[0] : null;

  const featuredFixtures = [...fixtures]
    .sort(
      (first, second) =>
        (second.confidence?.score ?? 0) -
        (first.confidence?.score ?? 0),
    )
    .slice(0, 6);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-amber-500/20 bg-gradient-to-l from-amber-950/25 via-slate-950 to-cyan-950/20 p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-amber-400">
            LEAGUES CENTER
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            الدوريات والبطولات
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            استعراض البطولات المتاحة وفق بيانات
            المباريات الحالية، مع عدد الفرق والمباريات
            ومتوسط ثقة المحرك.
          </p>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              البطولات المتاحة
            </p>

            <p className="mt-3 text-4xl font-black text-amber-300">
              {leagues.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              دول وبطولات ممثلة في البيانات
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              إجمالي الفرق
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {totalTeams}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              فرق مختلفة في المنصة
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              إجمالي المباريات
            </p>

            <p className="mt-3 text-4xl font-black text-violet-300">
              {fixtures.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              مباريات متاحة للتحليل
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              البطولة الأكبر
            </p>

            <p className="mt-3 text-2xl font-black text-emerald-300">
              {largestLeague?.name ?? "—"}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {largestLeague
                ? `${largestLeague.matches} مباراة`
                : "لا توجد بيانات"}
            </p>
          </article>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-amber-400">
              AVAILABLE LEAGUES
            </p>

            <h2 className="mt-2 text-3xl font-black">
              جميع البطولات
            </h2>

            <p className="mt-2 text-slate-500">
              ترتيب البطولات حسب عدد المباريات المتاحة.
            </p>
          </div>

          {leagues.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              لا توجد بيانات بطولات متاحة حاليًا.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league, index) => (
                <article
                  key={league.name}
                  className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 transition hover:border-amber-500/35"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.18em] text-amber-400">
                        LEAGUE #{index + 1}
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
                        الفرق
                      </p>

                      <p className="mt-2 text-2xl font-black text-cyan-300">
                        {league.teams}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-[#071023] p-4">
                      <p className="text-xs text-slate-500">
                        متوسط الثقة
                      </p>

                      <p className="mt-2 text-2xl font-black text-violet-300">
                        {league.averageConfidence}%
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-500">
                    تضم {league.matches} مباراة و
                    {" "}
                    {league.teams} فريقًا ضمن البيانات
                    الحالية.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
              FEATURED MATCHES
            </p>

            <h2 className="mt-2 text-3xl font-black">
              مباريات مختارة
            </h2>

            <p className="mt-2 text-slate-500">
              أعلى المباريات ترتيبًا وفق ثقة المحرك.
            </p>
          </div>

          {featuredFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              لا توجد مباريات متاحة حاليًا.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredFixtures.map((fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI — {modelVersion}
        </footer>
      </div>
    </main>
  );
}