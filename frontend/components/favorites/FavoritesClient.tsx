"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import FixtureCard from "@/components/home/FixtureCard";
import type { DashboardFixture } from "@/components/home/types";
import { normalizeStatus } from "@/components/home/helpers";
import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";
import {
  addFavorite,
  getFavorites,
  removeFavorite as removeFavoriteApi,
  type FavoriteItem,
} from "@/lib/favorites-api";

type FavoritesClientProps = {
  fixtures: DashboardFixture[];
  modelVersion: string;
};

function getFavoritesText(locale: Locale) {
  if (locale === "ar") {
    return {
      homeTeam: "الفريق المضيف",
      awayTeam: "الفريق الضيف",

      loadError:
        "تعذر تحميل المفضلة من حسابك حالياً.",
      removeError:
        "تعذر إزالة المباراة من المفضلة.",
      partialClearError:
        "تم حذف بعض المباريات، لكن تعذر حذف بعضها الآخر.",

      eyebrow: "مركز المفضلة",
      title: "المفضلة",
      description:
        "احتفظ بالمباريات المهمة في مكان واحد للوصول السريع إلى توقعاتها وتحليلها.",
      explorePredictions: "استكشاف التوقعات",

      savedMatches: "المباريات المحفوظة",
      savedMatchesNote:
        "مباريات أضفتها إلى المفضلة",

      availableMatches: "المباريات المتاحة",
      availableMatchesNote:
        "مباريات يمكن استكشافها",

      sectionEyebrow: "المباريات المحفوظة",
      sectionTitle: "المباريات المفضلة",
      savedInAccount:
        "يتم حفظ اختياراتك في حسابك.",
      savedInBrowser:
        "يتم حفظ اختياراتك في هذا المتصفح.",

      clearing: "جارٍ المسح...",
      clearAll: "مسح جميع المفضلة",

      loading: "جارٍ تحميل المفضلة...",
      emptyTitle: "لا توجد مباريات مفضلة",
      emptyDescription:
        "بعد إضافة مباراة إلى المفضلة، ستظهر هنا تلقائيًا.",
      goToPredictions:
        "الانتقال إلى مركز التوقعات",

      removeFavorite: "إزالة من المفضلة",
    };
  }

  if (locale === "sv") {
    return {
      homeTeam: "Hemmalaget",
      awayTeam: "Bortalaget",

      loadError:
        "Det gick inte att ladda favoriter från ditt konto.",
      removeError:
        "Det gick inte att ta bort matchen från favoriter.",
      partialClearError:
        "Vissa matcher togs bort, men några kunde inte tas bort.",

      eyebrow: "FAVORITCENTER",
      title: "Favoriter",
      description:
        "Spara viktiga matcher på ett ställe för snabb åtkomst till prognoser och analyser.",
      explorePredictions: "Utforska prognoser",

      savedMatches: "Sparade matcher",
      savedMatchesNote:
        "Matcher som du har lagt till i favoriter",

      availableMatches: "Tillgängliga matcher",
      availableMatchesNote:
        "Matcher som kan utforskas",

      sectionEyebrow: "SPARADE MATCHER",
      sectionTitle: "Favoritmatcher",
      savedInAccount:
        "Dina val sparas i ditt konto.",
      savedInBrowser:
        "Dina val sparas i den här webbläsaren.",

      clearing: "Rensar...",
      clearAll: "Rensa alla favoriter",

      loading: "Laddar favoriter...",
      emptyTitle: "Inga favoritmatcher",
      emptyDescription:
        "När du lägger till en match i favoriter visas den automatiskt här.",
      goToPredictions:
        "Gå till prognoscentret",

      removeFavorite: "Ta bort från favoriter",
    };
  }

  return {
    homeTeam: "Home Team",
    awayTeam: "Away Team",

    loadError:
      "Failed to load favorites from your account.",
    removeError:
      "Failed to remove the match from favorites.",
    partialClearError:
      "Some matches were removed, but others could not be removed.",

    eyebrow: "FAVORITES CENTER",
    title: "Favorites",
    description:
      "Keep important matches in one place for quick access to their predictions and analysis.",
    explorePredictions: "Explore Predictions",

    savedMatches: "Saved Matches",
    savedMatchesNote:
      "Matches you added to favorites",

    availableMatches: "Available Matches",
    availableMatchesNote:
      "Matches available to explore",

    sectionEyebrow: "SAVED MATCHES",
    sectionTitle: "Favorite Matches",
    savedInAccount:
      "Your selections are saved to your account.",
    savedInBrowser:
      "Your selections are saved in this browser.",

    clearing: "Clearing...",
    clearAll: "Clear All Favorites",

    loading: "Loading favorites...",
    emptyTitle: "No Favorite Matches",
    emptyDescription:
      "After adding a match to favorites, it will appear here automatically.",
    goToPredictions:
      "Go to Predictions Center",

    removeFavorite: "Remove from Favorites",
  };
}
const STORAGE_KEY =
  "football-analysis-favorite-fixtures";

function readLocalFavoriteIds(): number[] {
  try {
    const saved =
      window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed
          .map((value) => Number(value))
          .filter(
            (value) =>
              Number.isInteger(value) &&
              value > 0,
          ),
      ),
    );
  } catch {
    return [];
  }
}

function mapFavoriteToFixture(
  favorite: FavoriteItem,
  fallbackModelVersion: string,
  locale: Locale,
): DashboardFixture | null {
  const match = favorite.match;

  if (!match) {
    return null;
  }

  const prediction =
    match.latest_prediction;

  return {
    id: Number(match.id),

    predictionRecordId:
      prediction?.prediction_record_id,

    date: match.date,

    status: normalizeStatus(
      match.status ?? "scheduled",
    ),

    homeTeam: {
      id: match.home_team.id,
      name:
        match.home_team.name ||
        (locale === "sv"
          ? "Hemmalaget"
          : locale === "en"
            ? "Home Team"
            : "الفريق المضيف"),
      country:
        match.home_team.country ??
        undefined,
      logo:
        match.home_team.logo_url,
    },

    awayTeam: {
      id: match.away_team.id,
      name:
        match.away_team.name ||
        (locale === "sv"
          ? "Bortalaget"
          : locale === "en"
            ? "Away Team"
            : "الفريق الضيف"),
      country:
        match.away_team.country ??
        undefined,
      logo:
        match.away_team.logo_url,
    },

    predictedScore:
      prediction?.predicted_score ??
      undefined,

    expectedGoals:
      prediction?.expected_goals,

    probabilities: prediction
      ? {
          homeWin:
            prediction.probabilities.home_win,
          draw:
            prediction.probabilities.draw,
          awayWin:
            prediction.probabilities.away_win,
          over25:
            prediction.probabilities.over_2_5,
          under25:
            prediction.probabilities.under_2_5,
          btts:
            prediction.probabilities.btts,
          noBtts:
            prediction.probabilities.no_btts,
        }
      : undefined,

    bestPick:
      prediction?.best_pick
        ? {
            key:
              prediction.best_pick.key,
            label:
              prediction.best_pick.label,
            probability: Number(
              prediction.best_pick.probability,
            ),
          }
        : undefined,

    confidence:
      prediction
        ? {
            label:
              prediction.confidence.label,
            score: Number(
              prediction.confidence.score,
            ),
          }
        : undefined,

    modelVersion:
      prediction?.model_version ??
      fallbackModelVersion,
  };
}

export default function FavoritesClient({
  fixtures,
  modelVersion,
}: FavoritesClientProps) {
  const {
    accessToken,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const { locale, direction } = useLocale();
  const text = getFavoritesText(locale);

  const [favoriteIds, setFavoriteIds] =
    useState<number[]>([]);

  const [
    accountFavorites,
    setAccountFavorites,
  ] = useState<FavoriteItem[]>([]);

  const [isReady, setIsReady] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [isClearing, setIsClearing] =
    useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let active = true;

    async function loadFavorites() {
      setIsReady(false);
      setError(null);

      if (!isAuthenticated || !accessToken) {
        if (active) {
          setAccountFavorites([]);
          setFavoriteIds(
            readLocalFavoriteIds(),
          );
          setIsReady(true);
        }

        return;
      }

      try {
        const localIds =
          readLocalFavoriteIds();

        if (localIds.length > 0) {
          const results =
            await Promise.allSettled(
              localIds.map((matchId) =>
                addFavorite(
                  accessToken!,
                  matchId,
                ),
              ),
            );

          const migrationSucceeded =
            results.every(
              (result) =>
                result.status ===
                "fulfilled",
            );

          if (migrationSucceeded) {
            window.localStorage.removeItem(
              STORAGE_KEY,
            );
          }
        }

        const favorites =
          await getFavorites(accessToken!);

        if (!active) {
          return;
        }

        setAccountFavorites(favorites);

        setFavoriteIds(
          favorites.map(
            (favorite) =>
              favorite.match_id,
          ),
        );
      } catch {
        if (!active) {
          return;
        }

        setError(
          text.loadError,
        );
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void loadFavorites();

    return () => {
      active = false;
    };
  }, [
    accessToken,
    authLoading,
    isAuthenticated,
  ]);

  const favoriteFixtures = useMemo(() => {
    if (
      isAuthenticated &&
      accessToken
    ) {
      return accountFavorites
        .map((favorite) =>
          mapFavoriteToFixture(
            favorite,
            modelVersion,
            locale,
          ),
        )
        .filter(
          (
            fixture,
          ): fixture is DashboardFixture =>
            fixture !== null,
        );
    }

    const ids = new Set(favoriteIds);

    return fixtures.filter((fixture) =>
      ids.has(Number(fixture.id)),
    );
  }, [
    accessToken,
    accountFavorites,
    favoriteIds,
    fixtures,
    isAuthenticated,
    modelVersion,
    locale,
  ]);

  async function handleRemoveFavorite(
    fixtureId: number,
  ) {
    setError(null);

    if (!isAuthenticated || !accessToken) {
      const nextIds =
        favoriteIds.filter(
          (id) => id !== fixtureId,
        );

      setFavoriteIds(nextIds);

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextIds),
      );

      return;
    }

    try {
      await removeFavoriteApi(
        accessToken,
        fixtureId,
      );

      setFavoriteIds((current) =>
        current.filter(
          (id) => id !== fixtureId,
        ),
      );

      setAccountFavorites((current) =>
        current.filter(
          (favorite) =>
            favorite.match_id !==
            fixtureId,
        ),
      );
    } catch {
      setError(
        text.removeError,
      );
    }
  }

  async function handleClearFavorites() {
    if (favoriteIds.length === 0) {
      return;
    }

    setError(null);

    if (!isAuthenticated || !accessToken) {
      setFavoriteIds([]);
      setAccountFavorites([]);

      window.localStorage.removeItem(
        STORAGE_KEY,
      );

      return;
    }

    setIsClearing(true);

    try {
      const idsToRemove = [
        ...favoriteIds,
      ];

      const results =
        await Promise.allSettled(
          idsToRemove.map((matchId) =>
            removeFavoriteApi(
              accessToken,
              matchId,
            ),
          ),
        );

      const failedIds =
        idsToRemove.filter(
          (_, index) =>
            results[index].status ===
            "rejected",
        );

      setFavoriteIds(failedIds);

      const failedSet =
        new Set(failedIds);

      setAccountFavorites((current) =>
        current.filter((favorite) =>
          failedSet.has(
            favorite.match_id,
          ),
        ),
      );

      if (failedIds.length > 0) {
        setError(
          text.partialClearError,
        );
      }
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-pink-500/20 bg-gradient-to-l from-pink-950/25 via-slate-950 to-violet-950/20 p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-pink-400">
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
              className="rounded-xl border border-pink-500/30 bg-pink-500/10 px-5 py-3 font-black text-pink-300 transition hover:bg-pink-500/20"
            >
              {text.explorePredictions}
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.savedMatches}
            </p>

            <p className="mt-3 text-4xl font-black text-pink-300">
              {isReady
                ? favoriteFixtures.length
                : "—"}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.savedMatchesNote}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm font-bold text-slate-500">
              {text.availableMatches}
            </p>

            <p className="mt-3 text-4xl font-black text-cyan-300">
              {fixtures.length}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {text.availableMatchesNote}
            </p>
          </article>


        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-pink-400">
                {text.sectionEyebrow}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {text.sectionTitle}
              </h2>

              <p className="mt-2 text-slate-500">
                {isAuthenticated
                  ? text.savedInAccount
                  : text.savedInBrowser}
              </p>
            </div>

            {favoriteFixtures.length > 0 ? (
              <button
                type="button"
                disabled={isClearing}
                onClick={() =>
                  void handleClearFavorites()
                }
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isClearing
                  ? text.clearing
                  : text.clearAll}
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
              {error}
            </div>
          ) : null}

          {!isReady ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
              {text.loading}
            </div>
          ) : favoriteFixtures.length === 0 ? (
            <div className="rounded-3xl border border-pink-500/20 bg-pink-950/10 p-8">
              <h3 className="text-xl font-black text-pink-300">
                {text.emptyTitle}
              </h3>

              <p className="mt-3 max-w-2xl leading-8 text-slate-400">
                {text.emptyDescription}
              </p>

              <Link
                href="/predictions"
                className="mt-6 inline-flex rounded-xl bg-pink-500 px-5 py-3 font-black text-slate-950 transition hover:bg-pink-400"
              >
                {text.goToPredictions}
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteFixtures.map(
                (fixture) => (
                  <div
                    key={fixture.id}
                    className="space-y-3"
                  >
                    <FixtureCard
                      fixture={fixture}
                      showFavoriteAction={false}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void handleRemoveFavorite(
                          Number(
                            fixture.id,
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                    >
                      {text.removeFavorite}
                    </button>
                  </div>
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


