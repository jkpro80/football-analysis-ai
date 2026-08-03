import FixtureCard from "@/components/home/FixtureCard";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
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
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-violet-500/20 bg-gradient-to-l from-violet-950/30 via-slate-950 to-cyan-950/20 p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
            STATISTICS CENTER
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            مركز الإحصائيات
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            ملخص تحليلي لبيانات المباريات الحالية،
            مستوى الثقة، وأفضل توقعات محرك الذكاء
            الاصطناعي.
          </p>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              إجمالي المباريات
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {totalMatches}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              جميع المباريات المتاحة
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              متوسط الثقة
            </p>

            <p className="mt-3 text-4xl font-black text-violet-300">
              {averageConfidence}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              متوسط تقييم المحرك
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              متوسط أفضل توقع
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-300">
              {averageBestPick}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              متوسط احتمالات أفضل الاختيارات
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              ثقة مرتفعة
            </p>

            <p className="mt-3 text-4xl font-black text-amber-300">
              {highConfidenceMatches}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              مباريات بثقة 70% أو أكثر
            </p>
          </article>
        </section>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-sm font-bold text-slate-500">
              مجدولة
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-300">
              {scheduledMatches}
            </p>
          </article>

          <article className="rounded-3xl border border-red-500/20 bg-red-950/10 p-5">
            <p className="text-sm font-bold text-slate-500">
              مباشرة
            </p>

            <p className="mt-2 text-3xl font-black text-red-300">
              {liveMatches}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-sm font-bold text-slate-500">
              منتهية
            </p>

            <p className="mt-2 text-3xl font-black text-slate-300">
              {finishedMatches}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <p className="text-sm font-bold text-slate-500">
              إصدار المحرك
            </p>

            <p className="mt-2 text-2xl font-black text-violet-300">
              {modelVersion}
            </p>
          </article>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
              HIGHEST CONFIDENCE
            </p>

            <h2 className="mt-2 text-3xl font-black">
              أعلى المباريات ثقة
            </h2>

            <p className="mt-2 text-slate-500">
              المباريات المرتبة حسب تقييم الثقة الصادر
              عن المحرك.
            </p>
          </div>

          {topConfidenceFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              لا توجد بيانات إحصائية متاحة حاليًا.
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
              TOP PREDICTIONS
            </p>

            <h2 className="mt-2 text-3xl font-black">
              أقوى التوقعات
            </h2>

            <p className="mt-2 text-slate-500">
              أعلى الاختيارات وفق نسبة أفضل توقع في كل
              مباراة.
            </p>
          </div>

          {topPickFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              لا توجد توقعات متاحة حاليًا.
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
          Football Analysis AI — {modelVersion}
        </footer>
      </div>
    </main>
  );
}