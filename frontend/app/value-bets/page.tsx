import Link from "next/link";

import TopPickCard from "@/components/home/TopPickCard";
import { getDashboardData } from "@/lib/dashboard";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const VALUE_BETS_TEXT = {
  ar: {
    eyebrow: "مركز فرص القيمة",
    title: "أفضل فرص القيمة",
    description:
      "ترتيب أفضل اختيارات المحرك وفق أعلى احتمال متاح حاليًا. سيتم إضافة حساب القيمة المتوقعة ومقارنة أسعار السوق بصورة كاملة عند إطلاق محرك V7.",
    allPredictions: "جميع التوقعات",

    availableOpportunities: "الفرص المتاحة",
    availableNote: "اختيارات مرتبة حسب الاحتمال",

    strongestProbability: "أقوى احتمال",
    strongestNote: "أعلى اختيار حاليًا",

    averageProbability: "متوسط الاحتمال",
    averageNote: "لجميع الفرص المعروضة",

    highConfidence: "ثقة مرتفعة",
    highConfidenceNote: "ثقة 70% أو أكثر",

    rankedEyebrow: "الفرص المرتبة",
    rankedTitle: "الفرص المرتبة",
    rankedDescription:
      "يتم عرض المباريات التي تحتوي على أفضل اختيار من محرك التوقعات الحالي.",

    noOpportunities: "لا توجد فرص قيمة متاحة",
    noOpportunitiesDescription:
      "لم يعثر المحرك على اختيارات مناسبة في المباريات الحالية.",
  },

  en: {
    eyebrow: "VALUE BETS CENTER",
    title: "Best Value Opportunities",
    description:
      "The engine's best selections ranked by the highest currently available probability. Expected value calculations and market-odds comparisons will be added in full with the V7 engine.",
    allPredictions: "All Predictions",

    availableOpportunities: "Available Opportunities",
    availableNote: "Selections ranked by probability",

    strongestProbability: "Strongest Probability",
    strongestNote: "Highest selection currently",

    averageProbability: "Average Probability",
    averageNote: "Across all displayed opportunities",

    highConfidence: "High Confidence",
    highConfidenceNote: "70% confidence or higher",

    rankedEyebrow: "RANKED OPPORTUNITIES",
    rankedTitle: "Ranked Opportunities",
    rankedDescription:
      "Matches containing the current prediction engine's best selection are shown here.",

    noOpportunities: "No value opportunities available",
    noOpportunitiesDescription:
      "The engine did not find suitable selections among the current matches.",
  },

  sv: {
    eyebrow: "VALUE BETS-CENTER",
    title: "Bästa värdemöjligheterna",
    description:
      "Motorns bästa val rangordnade efter högsta tillgängliga sannolikhet. Beräkning av förväntat värde och jämförelse med marknadsodds läggs till fullt ut med V7-motorn.",
    allPredictions: "Alla prognoser",

    availableOpportunities: "Tillgängliga möjligheter",
    availableNote: "Val rangordnade efter sannolikhet",

    strongestProbability: "Högsta sannolikhet",
    strongestNote: "Högsta valet just nu",

    averageProbability: "Genomsnittlig sannolikhet",
    averageNote: "För alla visade möjligheter",

    highConfidence: "Hög säkerhet",
    highConfidenceNote: "70 % säkerhet eller högre",

    rankedEyebrow: "RANKADE MÖJLIGHETER",
    rankedTitle: "Rankade möjligheter",
    rankedDescription:
      "Här visas matcher som innehåller det bästa valet från den nuvarande prognosmotorn.",

    noOpportunities: "Inga värdemöjligheter tillgängliga",
    noOpportunitiesDescription:
      "Motorn hittade inga lämpliga val bland de aktuella matcherna.",
  },
} as const;
export default async function ValueBetsPage() {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = VALUE_BETS_TEXT[locale];
  const { fixtures, modelVersion } =
    await getDashboardData();

  const valueBets = [...fixtures]
    .filter(
      (fixture) =>
        fixture.bestPick !== undefined &&
        (fixture.bestPick?.probability ?? 0) > 0,
    )
    .sort(
      (first, second) =>
        (second.bestPick?.probability ?? 0) -
        (first.bestPick?.probability ?? 0),
    );

  const strongestPick =
    valueBets.length > 0
      ? valueBets[0].bestPick?.probability ?? 0
      : 0;

  const averageProbability =
    valueBets.length > 0
      ? Math.round(
          valueBets.reduce(
            (total, fixture) =>
              total +
              (fixture.bestPick?.probability ?? 0),
            0,
          ) / valueBets.length,
        )
      : 0;

  const highConfidenceBets = valueBets.filter(
    (fixture) =>
      (fixture.confidence?.score ?? 0) >= 70,
  ).length;

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-l from-emerald-950/30 via-slate-950 to-cyan-950/30 p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
                {text.eyebrow}
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                {text.title}
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                {text.description}
              </p>
            </div>

            <Link
              href="/predictions"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-black text-emerald-300 transition hover:bg-emerald-500/20"
            >
              {text.allPredictions}
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.availableOpportunities}
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-300">
              {valueBets.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.availableNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.strongestProbability}
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {Math.round(strongestPick)}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.strongestNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.averageProbability}
            </p>

            <p className="mt-3 text-4xl font-black text-violet-300">
              {averageProbability}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.averageNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.highConfidence}
            </p>

            <p className="mt-3 text-4xl font-black text-amber-300">
              {highConfidenceBets}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.highConfidenceNote}
            </p>
          </article>
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
              {text.rankedEyebrow}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {text.rankedTitle}
            </h2>

            <p className="mt-2 text-slate-500">
              {text.rankedDescription}
            </p>
          </div>

          {valueBets.length === 0 ? (
            <div className="rounded-3xl border border-amber-500/25 bg-amber-950/10 p-8">
              <h3 className="text-xl font-black text-amber-300">
                {text.noOpportunities}
              </h3>

              <p className="mt-3 text-slate-400">
                {text.noOpportunitiesDescription}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {valueBets.map((fixture, index) => (
                <TopPickCard
                  key={fixture.id}
                  fixture={fixture}
                  rank={index + 1}
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



