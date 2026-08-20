import FixtureCard from "@/components/home/FixtureCard";
import { getDashboardData } from "@/lib/dashboard";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
const STATISTICS_TEXT = {
  ar: {
    eyebrow: "مركز الإحصائيات",
    title: "مركز الإحصائيات",
    description:
      "{text.description}",

    totalMatches: "إجمالي المباريات",
    totalMatchesNote: "جميع المباريات المتاحة",

    averageConfidence: "متوسط الثقة",
    averageConfidenceNote: "متوسط تقييم المحرك",

    averageBestPick: "متوسط أفضل توقع",
    averageBestPickNote: "متوسط احتمالات أفضل الاختيارات",

    highConfidence: "ثقة مرتفعة",
    highConfidenceNote: "مباريات بثقة 70% أو أكثر",

    scheduled: "مجدولة",
    live: "مباشرة",
    finished: "منتهية",

    confidenceEyebrow: "أعلى ثقة",
    confidenceTitle: "أعلى المباريات ثقة",
    confidenceDescription:
      "{text.confidenceDescription}",
    noStatistics: "لا توجد بيانات إحصائية متاحة حاليًا.",

    predictionsEyebrow: "أفضل التوقعات",
    predictionsTitle: "أقوى التوقعات",
    predictionsDescription:
      "{text.predictionsDescription}",
    noPredictions: "لا توجد توقعات متاحة حاليًا.",
  },

  sv: {
    eyebrow: "STATISTIKCENTER",
    title: "Statistikcenter",
    description:
      "En analytisk sammanfattning av aktuella matchdata, säkerhetsnivåer och AI-motorns bästa prognoser.",

    totalMatches: "Totalt antal matcher",
    totalMatchesNote: "Alla tillgängliga matcher",

    averageConfidence: "Genomsnittlig säkerhet",
    averageConfidenceNote: "Motorns genomsnittliga bedömning",

    averageBestPick: "Genomsnittligt bästa val",
    averageBestPickNote: "Genomsnittlig sannolikhet för bästa val",

    highConfidence: "Hög säkerhet",
    highConfidenceNote: "Matcher med 70% säkerhet eller högre",

    scheduled: "Schemalagda",
    live: "Live",
    finished: "Avslutade",

    confidenceEyebrow: "HÖGSTA SÄKERHET",
    confidenceTitle: "Matcher med högst säkerhet",
    confidenceDescription:
      "Matcher rankade efter motorns säkerhetsbedömning.",
    noStatistics: "Ingen statistisk data är tillgänglig just nu.",

    predictionsEyebrow: "BÄSTA PROGNOSER",
    predictionsTitle: "Starkaste prognoserna",
    predictionsDescription:
      "De högst rankade valen baserat på bästa prognos för varje match.",
    noPredictions: "Inga prognoser är tillgängliga just nu.",
  },

  en: {
    eyebrow: "STATISTICS CENTER",
    title: "Statistics Center",
    description:
      "An analytical summary of current match data, confidence levels and the AI engine's best predictions.",

    totalMatches: "Total Matches",
    totalMatchesNote: "All available matches",

    averageConfidence: "Average Confidence",
    averageConfidenceNote: "Average engine confidence",

    averageBestPick: "Average Best Pick",
    averageBestPickNote: "Average probability of the best selections",

    highConfidence: "High Confidence",
    highConfidenceNote: "Matches with 70% confidence or higher",

    scheduled: "Scheduled",
    live: "Live",
    finished: "Finished",

    confidenceEyebrow: "HIGHEST CONFIDENCE",
    confidenceTitle: "Highest Confidence Matches",
    confidenceDescription:
      "Matches ranked by the confidence score produced by the engine.",
    noStatistics: "No statistical data is currently available.",

    predictionsEyebrow: "TOP PREDICTIONS",
    predictionsTitle: "Top Predictions",
    predictionsDescription:
      "The highest-ranked selections based on each match's best-pick probability.",
    noPredictions: "No predictions are currently available.",
  },
} as const;

export default async function StatisticsPage() {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = STATISTICS_TEXT[locale];

  const { fixtures, modelVersion } =
    await getDashboardData();

  const totalMatches = fixtures.length;

  const scheduledMatches = fixtures.filter(
    (fixture) =>
      fixture.status?.toLowerCase() ===
      "scheduled",
  ).length;

  const liveMatches = fixtures.filter(
    (fixture) =>
      fixture.status?.toLowerCase() === "live",
  ).length;

  const finishedMatches = fixtures.filter(
    (fixture) =>
      fixture.status?.toLowerCase() ===
      "finished",
  ).length;

  const averageConfidence =
    totalMatches > 0
      ? Math.round(
          fixtures.reduce(
            (total, fixture) =>
              total +
              (fixture.confidence?.score ?? 0),
            0,
          ) / totalMatches,
        )
      : 0;

  const fixturesWithBestPick = fixtures.filter(
    (fixture) =>
      fixture.bestPick !== undefined,
  );

  const averageBestPick =
    fixturesWithBestPick.length > 0
      ? Math.round(
          fixturesWithBestPick.reduce(
            (total, fixture) =>
              total +
              (fixture.bestPick?.probability ?? 0),
            0,
          ) / fixturesWithBestPick.length,
        )
      : 0;

  const highConfidenceMatches = fixtures.filter(
    (fixture) =>
      (fixture.confidence?.score ?? 0) >= 70,
  ).length;

  const topConfidenceFixtures = [...fixtures]
    .sort(
      (first, second) =>
        (second.confidence?.score ?? 0) -
        (first.confidence?.score ?? 0),
    )
    .slice(0, 6);

  const topPickFixtures = [...fixtures]
    .filter(
      (fixture) =>
        fixture.bestPick !== undefined,
    )
    .sort(
      (first, second) =>
        (second.bestPick?.probability ?? 0) -
        (first.bestPick?.probability ?? 0),
    )
    .slice(0, 6);

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-violet-500/20 bg-gradient-to-l from-violet-950/30 via-slate-950 to-cyan-950/20 p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
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
              {text.totalMatches}
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {totalMatches}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.totalMatchesNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.averageConfidence}
            </p>

            <p className="mt-3 text-4xl font-black text-violet-300">
              {averageConfidence}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.averageConfidenceNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.averageBestPick}
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-300">
              {averageBestPick}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.averageBestPickNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.highConfidence}
            </p>

            <p className="mt-3 text-4xl font-black text-amber-300">
              {highConfidenceMatches}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.highConfidenceNote}
            </p>
          </article>
        </section>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-sm font-bold text-slate-500">
              {text.scheduled}
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-300">
              {scheduledMatches}
            </p>
          </article>

          <article className="rounded-3xl border border-red-500/20 bg-red-950/10 p-5">
            <p className="text-sm font-bold text-slate-500">
              {text.live}
            </p>

            <p className="mt-2 text-3xl font-black text-red-300">
              {liveMatches}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-sm font-bold text-slate-500">
              {text.finished}
            </p>

            <p className="mt-2 text-3xl font-black text-slate-300">
              {finishedMatches}
            </p>
          </article>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
              {text.confidenceEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.confidenceTitle}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.confidenceDescription}
            </p>
          </div>

          {topConfidenceFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              {text.noStatistics}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topConfidenceFixtures.map((fixture) => (
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
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
              {text.predictionsEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.predictionsTitle}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.predictionsDescription}
            </p>
          </div>

          {topPickFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              {text.noPredictions}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topPickFixtures.map((fixture) => (
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



