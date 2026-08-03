import Link from "next/link";

import TopPickCard from "@/components/home/TopPickCard";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function ValueBetsPage() {
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
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-l from-emerald-950/30 via-slate-950 to-cyan-950/30 p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
                VALUE BETS CENTER
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                أفضل فرص القيمة
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                ترتيب أفضل اختيارات المحرك وفق أعلى
                احتمال متاح حاليًا. سيتم إضافة حساب
                القيمة المتوقعة ومقارنة أسعار السوق
                بصورة كاملة عند إطلاق محرك V7.
              </p>
            </div>

            <Link
              href="/predictions"
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-black text-emerald-300 transition hover:bg-emerald-500/20"
            >
              جميع التوقعات
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              الفرص المتاحة
            </p>

            <p className="mt-3 text-4xl font-black text-emerald-300">
              {valueBets.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              اختيارات مرتبة حسب الاحتمال
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              أقوى احتمال
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {Math.round(strongestPick)}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              أعلى اختيار حاليًا
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              متوسط الاحتمال
            </p>

            <p className="mt-3 text-4xl font-black text-violet-300">
              {averageProbability}%
            </p>

            <p className="mt-2 text-sm text-slate-600">
              لجميع الفرص المعروضة
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              ثقة مرتفعة
            </p>

            <p className="mt-3 text-4xl font-black text-amber-300">
              {highConfidenceBets}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              ثقة 70% أو أكثر
            </p>
          </article>
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
              RANKED OPPORTUNITIES
            </p>

            <h2 className="mt-2 text-3xl font-black">
              الفرص المرتبة
            </h2>

            <p className="mt-2 text-slate-500">
              يتم عرض المباريات التي تحتوي على أفضل
              اختيار من محرك التوقعات الحالي.
            </p>
          </div>

          {valueBets.length === 0 ? (
            <div className="rounded-3xl border border-amber-500/25 bg-amber-950/10 p-8">
              <h3 className="text-xl font-black text-amber-300">
                لا توجد فرص قيمة متاحة
              </h3>

              <p className="mt-3 text-slate-400">
                لم يعثر المحرك على اختيارات مناسبة في
                المباريات الحالية.
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
          Football Analysis AI — {modelVersion}
        </footer>
      </div>
    </main>
  );
}