"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import FixtureCard from "@/components/home/FixtureCard";
import type { DashboardFixture } from "@/components/home/types";

type FavoritesClientProps = {
  fixtures: DashboardFixture[];
  modelVersion: string;
};

const STORAGE_KEY =
  "football-analysis-favorite-fixtures";

function readFavoriteIds(): number[] {
  try {
    const saved = window.localStorage.getItem(
      STORAGE_KEY,
    );

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

export default function FavoritesClient({
  fixtures,
  modelVersion,
}: FavoritesClientProps) {
  const [favoriteIds, setFavoriteIds] = useState<
    number[]
  >([]);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
    setIsReady(true);
  }, []);

  const favoriteFixtures = useMemo(() => {
    const ids = new Set(favoriteIds);

    return fixtures.filter((fixture) =>
      ids.has(Number(fixture.id)),
    );
  }, [favoriteIds, fixtures]);

  const removeFavorite = (fixtureId: number) => {
    const nextIds = favoriteIds.filter(
      (id) => id !== fixtureId,
    );

    setFavoriteIds(nextIds);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextIds),
    );
  };

  const clearFavorites = () => {
    setFavoriteIds([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-pink-500/20 bg-gradient-to-l from-pink-950/25 via-slate-950 to-violet-950/20 p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-pink-400">
                FAVORITES CENTER
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                المفضلة
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                احتفظ بالمباريات المهمة في مكان واحد
                للوصول السريع إلى توقعاتها وتحليلها.
              </p>
            </div>

            <Link
              href="/predictions"
              className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-5 py-3 font-black text-pink-300 transition hover:bg-pink-500/20"
            >
              استكشاف التوقعات
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              المباريات المحفوظة
            </p>

            <p className="mt-3 text-4xl font-black text-pink-300">
              {isReady ? favoriteFixtures.length : "—"}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              مباريات أضفتها إلى المفضلة
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              المباريات المتاحة
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {fixtures.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              مباريات يمكن استكشافها
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
              المحرك المستخدم في التوقعات
            </p>
          </article>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-pink-400">
                SAVED MATCHES
              </p>

              <h2 className="mt-2 text-3xl font-black">
                المباريات المفضلة
              </h2>

              <p className="mt-2 text-slate-500">
                يتم حفظ اختياراتك في هذا المتصفح.
              </p>
            </div>

            {favoriteFixtures.length > 0 ? (
              <button
                type="button"
                onClick={clearFavorites}
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/20"
              >
                مسح جميع المفضلة
              </button>
            ) : null}
          </div>

          {!isReady ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              جارٍ تحميل المفضلة...
            </div>
          ) : favoriteFixtures.length === 0 ? (
            <div className="rounded-3xl border border-pink-500/20 bg-pink-950/10 p-8">
              <h3 className="text-xl font-black text-pink-300">
                لا توجد مباريات مفضلة
              </h3>

              <p className="mt-3 max-w-2xl leading-8 text-slate-400">
                بعد إضافة زر المفضلة إلى بطاقات
                المباريات، ستظهر المباريات التي تحفظها
                هنا تلقائيًا.
              </p>

              <Link
                href="/predictions"
                className="mt-6 inline-flex rounded-xl bg-pink-500 px-5 py-3 font-black text-slate-950 transition hover:bg-pink-400"
              >
                الانتقال إلى مركز التوقعات
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="space-y-3"
                >
                  <FixtureCard fixture={fixture} />

                  <button
                    type="button"
                    onClick={() =>
                      removeFavorite(
                        Number(fixture.id),
                      )
                    }
                    className="w-full rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                  >
                    إزالة من المفضلة
                  </button>
                </div>
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
