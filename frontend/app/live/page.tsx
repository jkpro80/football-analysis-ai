import Link from "next/link";

import FixtureCard from "@/components/home/FixtureCard";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const { fixtures, modelVersion } =
    await getDashboardData();

  const liveFixtures = fixtures.filter(
    (fixture) =>
      fixture.status?.toLowerCase() === "live",
  );

  const scheduledFixtures = fixtures
    .filter(
      (fixture) =>
        fixture.status?.toLowerCase() ===
        "scheduled",
    )
    .slice(0, 6);

  return (
    <main
      dir="rtl"
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
                  LIVE MATCHES CENTER
                </p>
              </div>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                المباريات المباشرة
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                متابعة المباريات الجارية حاليًا مع
                الوصول السريع إلى صفحة التحليل لكل
                مباراة.
              </p>
            </div>

            <Link
              href="/fixtures"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-black text-red-300 transition hover:bg-red-500/20"
            >
              جميع المباريات
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6">
            <p className="text-sm font-bold text-slate-500">
              مباشر الآن
            </p>

            <p className="mt-3 text-4xl font-black text-red-300">
              {liveFixtures.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              مباريات جارية حاليًا
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              المباريات المجدولة
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {
                fixtures.filter(
                  (fixture) =>
                    fixture.status?.toLowerCase() ===
                    "scheduled",
                ).length
              }
            </p>

            <p className="mt-2 text-sm text-slate-600">
              مباريات قادمة
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              إصدار المحرك
            </p>

            <p className="mt-3 text-2xl font-black text-violet-300">
              {modelVersion}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              المحرك المستخدم في التحليل
            </p>
          </article>
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-[0.2em] text-red-400">
              LIVE NOW
            </p>

            <h2 className="mt-2 text-3xl font-black">
              مباشر الآن
            </h2>

            <p className="mt-2 text-slate-500">
              المباريات التي تحمل حالة Live في قاعدة
              البيانات.
            </p>
          </div>

          {liveFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-slate-600" />

                <h3 className="text-xl font-black text-slate-200">
                  لا توجد مباريات مباشرة الآن
                </h3>
              </div>

              <p className="mt-3 text-slate-400">
                ستظهر المباريات هنا تلقائيًا عندما
                تتغير حالتها إلى مباشر.
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
              UPCOMING MATCHES
            </p>

            <h2 className="mt-2 text-3xl font-black">
              المباريات القادمة
            </h2>

            <p className="mt-2 text-slate-500">
              أقرب المباريات المجدولة المتاحة في
              المنصة.
            </p>
          </div>

          {scheduledFixtures.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              لا توجد مباريات مجدولة حاليًا.
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
          Football Analysis AI — {modelVersion}
        </footer>
      </div>
    </main>
  );
}