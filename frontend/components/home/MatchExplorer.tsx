"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

import FixtureCard from "./FixtureCard";
import {
  QUICK_FILTERS,
  matchesQuickFilter,
  normalizeDate,
  normalizeText,
} from "./helpers";
import type {
  DashboardFixture,
  QuickFilter,
  SortOption,
  StatusFilter,
} from "./types";

type MatchExplorerProps = {
  fixtures: DashboardFixture[];
  initialHasMore?: boolean;
  initialNextOffset?: number;
};

const PAGE_SIZE = 12;

function getText(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "استكشاف المباريات",
      description:
        "ابحث عن فريق، واختر نوع التوقع، ورتّب النتائج وفق الثقة أو التاريخ.",

      searchPlaceholder:
        "ابحث باسم الفريق...",

      allStatuses: "جميع الحالات",
      scheduled: "مجدولة",
      live: "مباشرة",
      finished: "منتهية",

      sortConfidence:
        "ترتيب حسب الثقة",
      sortBestPick:
        "ترتيب حسب أفضل توقع",
      sortDate:
        "ترتيب حسب التاريخ",

      resultCount: "عدد النتائج",
      showing: "عرض",
      of: "من",

      clearFilters:
        "مسح البحث والفلاتر",

      noMatches:
        "لا توجد مباريات مطابقة",
      noMatchesDescription:
        "غيّر عبارة البحث أو اختر فلترًا مختلفًا.",

      paginationLabel:
        "ترقيم صفحات المباريات",

      first: "الأول",
      previous: "السابق",
      next: "التالي",
      last: "الأخير",
      loadMore: "تحميل 50 مباراة إضافية",
      loadingMore: "جارٍ تحميل المباريات...",
      loadMoreError:
        "تعذر تحميل المزيد من المباريات. حاول مرة أخرى.",

      quickFilters: {
        all: "جميع المباريات",
        today: "اليوم",
        tomorrow: "غدًا",
        week: "هذا الأسبوع",
        "high-confidence": "ثقة مرتفعة",
        over25: "أكثر من 2.5",
        btts: "تسجيل الفريقين",
        "home-win": "فوز المضيف",
        "away-win": "فوز الضيف",
      } satisfies Record<QuickFilter, string>,
    };
  }

  if (locale === "sv") {
    return {
      title: "Utforska matcher",
      description:
        "Sök efter ett lag, välj prognostyp och sortera resultaten efter säkerhet eller datum.",

      searchPlaceholder:
        "Sök efter lagnamn...",

      allStatuses: "Alla statusar",
      scheduled: "Schemalagda",
      live: "Live",
      finished: "Avslutade",

      sortConfidence:
        "Sortera efter säkerhet",
      sortBestPick:
        "Sortera efter bästa val",
      sortDate:
        "Sortera efter datum",

      resultCount: "Antal resultat",
      showing: "Visar",
      of: "av",

      clearFilters:
        "Rensa sökning och filter",

      noMatches:
        "Inga matchande matcher",
      noMatchesDescription:
        "Ändra sökningen eller välj ett annat filter.",

      paginationLabel:
        "Sidnumrering för matcher",

      first: "Första",
      previous: "Föregående",
      next: "Nästa",
      last: "Sista",
      loadMore: "Ladda 50 matcher till",
      loadingMore: "Laddar matcher...",
      loadMoreError:
        "Det gick inte att ladda fler matcher. Försök igen.",

      quickFilters: {
        all: "Alla matcher",
        today: "Idag",
        tomorrow: "Imorgon",
        week: "Denna vecka",
        "high-confidence": "Hög säkerhet",
        over25: "Över 2,5",
        btts: "Båda lagen gör mål",
        "home-win": "Hemmaseger",
        "away-win": "Bortaseger",
      } satisfies Record<QuickFilter, string>,
    };
  }

  return {
    title: "Match Explorer",
    description:
      "Search for a team, choose a prediction type and sort results by confidence or date.",

    searchPlaceholder:
      "Search by team name...",

    allStatuses: "All statuses",
    scheduled: "Scheduled",
    live: "Live",
    finished: "Finished",

    sortConfidence:
      "Sort by confidence",
    sortBestPick:
      "Sort by best pick",
    sortDate:
      "Sort by date",

    resultCount: "Results",
    showing: "Showing",
    of: "of",

    clearFilters:
      "Clear search and filters",

    noMatches:
      "No matching matches",
    noMatchesDescription:
      "Change your search or choose a different filter.",

    paginationLabel:
      "Match pagination",

    first: "First",
    previous: "Previous",
    next: "Next",
    last: "Last",
    loadMore: "Load 50 more matches",
    loadingMore: "Loading matches...",
    loadMoreError:
      "Could not load more matches. Please try again.",

    quickFilters: {
      all: "All matches",
      today: "Today",
      tomorrow: "Tomorrow",
      week: "This week",
      "high-confidence": "High confidence",
      over25: "Over 2.5",
      btts: "Both teams to score",
      "home-win": "Home win",
      "away-win": "Away win",
    } satisfies Record<QuickFilter, string>,
  };
}

export default function MatchExplorer({
  fixtures,
  initialHasMore = false,
  initialNextOffset = 50,
}: MatchExplorerProps) {
  const {
    locale,
    direction,
  } = useLocale();

  const t = getText(locale);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("scheduled");

  const [sortOption, setSortOption] =
    useState<SortOption>("date");

  const [quickFilter, setQuickFilter] =
    useState<QuickFilter>("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loadedFixtures, setLoadedFixtures] =
    useState<DashboardFixture[]>(fixtures);

  const [
    nextUpcomingOffset,
    setNextUpcomingOffset,
  ] = useState(initialNextOffset);

  const [
    hasMoreUpcoming,
    setHasMoreUpcoming,
  ] = useState(initialHasMore);

  const [isLoadingMore, setIsLoadingMore] =
    useState(false);

  const [loadMoreError, setLoadMoreError] =
    useState<string | null>(null);

  const filteredFixtures = useMemo(() => {
    const normalizedSearch =
      normalizeText(search);

    const result = loadedFixtures.filter(
      (fixture) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          normalizeText(
            fixture.homeTeam.name,
          ).includes(normalizedSearch) ||
          normalizeText(
            fixture.awayTeam.name,
          ).includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" ||
          fixture.status?.toLowerCase() ===
            statusFilter;

        const matchesQuick =
          matchesQuickFilter(
            fixture,
            quickFilter,
          );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesQuick
        );
      },
    );

    return [...result].sort(
      (first, second) => {
        if (
          sortOption === "confidence"
        ) {
          return (
            (second.confidence?.score ??
              0) -
            (first.confidence?.score ??
              0)
          );
        }

        if (
          sortOption === "best-pick"
        ) {
          return (
            (second.bestPick
              ?.probability ?? 0) -
            (first.bestPick
              ?.probability ?? 0)
          );
        }

        const firstDate =
          normalizeDate(
            first.date,
          )?.getTime() ??
          Number.MAX_SAFE_INTEGER;

        const secondDate =
          normalizeDate(
            second.date,
          )?.getTime() ??
          Number.MAX_SAFE_INTEGER;

        return firstDate - secondDate;
      },
    );
  }, [
    loadedFixtures,
    search,
    statusFilter,
    sortOption,
    quickFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    sortOption,
    quickFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFixtures.length /
        PAGE_SIZE,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedFixtures =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        PAGE_SIZE;

      return filteredFixtures.slice(
        startIndex,
        startIndex + PAGE_SIZE,
      );
    }, [
      currentPage,
      filteredFixtures,
    ]);

  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      currentPage - 2,
    );

    const endPage = Math.min(
      totalPages,
      startPage +
        maxVisiblePages -
        1,
    );

    startPage = Math.max(
      1,
      endPage -
        maxVisiblePages +
        1,
    );

    return Array.from(
      {
        length:
          endPage -
          startPage +
          1,
      },
      (_, index) =>
        startPage + index,
    );
  }, [
    currentPage,
    totalPages,
  ]);

  const firstVisibleResult =
    filteredFixtures.length === 0
      ? 0
      : (currentPage - 1) *
          PAGE_SIZE +
        1;

  const lastVisibleResult =
    Math.min(
      currentPage * PAGE_SIZE,
      filteredFixtures.length,
    );

  const loadMoreUpcoming = useCallback(
    async () => {
      if (
        isLoadingMore ||
        !hasMoreUpcoming
      ) {
        return;
      }

      setIsLoadingMore(true);
      setLoadMoreError(null);

      try {
        const response = await fetch(
          `/dashboard-data/upcoming?offset=${nextUpcomingOffset}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Load more failed: ${response.status}`,
          );
        }

        const payload = (await response.json()) as {
          fixtures?: DashboardFixture[];
          hasMore?: boolean;
          nextOffset?: number;
        };

        const incoming =
          Array.isArray(payload.fixtures)
            ? payload.fixtures
            : [];

        setLoadedFixtures((current) => {
          const byId =
            new Map<number, DashboardFixture>();

          for (const fixture of current) {
            byId.set(
              fixture.id,
              fixture,
            );
          }

          for (const fixture of incoming) {
            byId.set(
              fixture.id,
              fixture,
            );
          }

          return Array.from(
            byId.values(),
          );
        });

        const payloadNextOffset =
          Number(payload.nextOffset);

        setNextUpcomingOffset(
          Number.isFinite(payloadNextOffset) &&
            payloadNextOffset >
              nextUpcomingOffset
            ? payloadNextOffset
            : nextUpcomingOffset + 50,
        );

        setHasMoreUpcoming(
          Boolean(payload.hasMore),
        );
      } catch (error) {
        console.error(
          "Failed to load more matches:",
          error,
        );

        setLoadMoreError(
          t.loadMoreError,
        );
      } finally {
        setIsLoadingMore(false);
      }
    },
    [
      hasMoreUpcoming,
      isLoadingMore,
      nextUpcomingOffset,
      t.loadMoreError,
    ],
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("scheduled");
    setSortOption("date");
    setQuickFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.length > 0 ||
    statusFilter !== "scheduled" ||
    quickFilter !== "all";

  return (
    <section dir={direction}>
      <div className="mb-6">
        <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
          MATCH EXPLORER
        </p>

        <h2 className="mt-2 text-3xl font-black">
          {t.title}
        </h2>

        <p className="mt-2 text-white/50">
          {t.description}
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {QUICK_FILTERS.map(
          (filter) => {
            const isActive =
              quickFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() =>
                  setQuickFilter(
                    filter.key,
                  )
                }
                className={[
                  "rounded-full border px-4 py-2 text-sm font-bold transition",
                  isActive
                    ? "border-cyan-400 bg-cyan-500 text-slate-950"
                    : "border-[#242B33] bg-[#11161C]/50 text-white/80 hover:border-cyan-500/50",
                ].join(" ")}
              >
                {
                  t.quickFilters[
                    filter.key
                  ]
                }
              </button>
            );
          },
        )}
      </div>

      <div className="grid gap-4 rounded-3xl border border-[#242B33] bg-[#11161C]/50 p-5 lg:grid-cols-[1fr_auto_auto]">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder={
            t.searchPlaceholder
          }
          className="w-full rounded-xl border border-[#242B33] bg-[#0C1014] px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-cyan-500"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as StatusFilter,
            )
          }
          className="rounded-xl border border-[#242B33] bg-[#0C1014] px-4 py-3 text-white outline-none focus:border-cyan-500"
        >
          <option value="all">
            {t.allStatuses}
          </option>

          <option value="scheduled">
            {t.scheduled}
          </option>

          <option value="live">
            {t.live}
          </option>

          <option value="finished">
            {t.finished}
          </option>
        </select>

        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(
              event.target
                .value as SortOption,
            )
          }
          className="rounded-xl border border-[#242B33] bg-[#0C1014] px-4 py-3 text-white outline-none focus:border-cyan-500"
        >
          <option value="confidence">
            {t.sortConfidence}
          </option>

          <option value="best-pick">
            {t.sortBestPick}
          </option>

          <option value="date">
            {t.sortDate}
          </option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-white/50">
          {t.resultCount}:{" "}
          <strong className="text-white">
            {filteredFixtures.length}
          </strong>
        </p>

        {filteredFixtures.length >
        0 ? (
          <p className="text-sm text-white/50">
            {t.showing}{" "}
            <strong className="text-white">
              {firstVisibleResult}
            </strong>
            {" - "}
            <strong className="text-white">
              {lastVisibleResult}
            </strong>
            {` ${t.of} `}
            <strong className="text-white">
              {
                filteredFixtures.length
              }
            </strong>
          </p>
        ) : null}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            {t.clearFilters}
          </button>
        ) : null}
      </div>

      {filteredFixtures.length ===
      0 ? (
        <div className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-950/10 p-8">
          <h3 className="text-xl font-black text-amber-300">
            {t.noMatches}
          </h3>

          <p className="mt-3 text-white/65">
            {t.noMatchesDescription}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedFixtures.map(
              (fixture) => (
                <FixtureCard
                  key={fixture.id}
                  fixture={fixture}
                />
              ),
            )}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label={
                t.paginationLabel
              }
              className="mt-5 flex flex-nowrap items-center justify-center gap-1 sm:mt-8 sm:flex-wrap sm:gap-2"
            >
              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(1)
                }
                className="hidden rounded-lg border border-[#242B33] bg-[#11161C]/60 px-3 py-2 text-sm font-bold text-white/80 transition hover:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:block"
              >
                {t.first}
              </button>

              <button
                type="button"
                disabled={
                  currentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1,
                      ),
                  )
                }
                className="rounded-lg border border-[#242B33] bg-[#11161C]/60 px-2 py-1.5 text-[11px] font-bold text-white/80 transition hover:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-2 sm:text-sm"
              >
                {t.previous}
              </button>

              {pageNumbers.map(
                (pageNumber) => (
                  <button
                    key={
                      pageNumber
                    }
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        pageNumber,
                      )
                    }
                    className={[
                      "min-w-7 rounded-lg border px-2 py-1.5 text-[11px] font-black transition sm:min-w-10 sm:px-3 sm:py-2 sm:text-sm",
                      pageNumber ===
                      currentPage
                        ? "border-cyan-400 bg-cyan-500 text-slate-950"
                        : "border-[#242B33] bg-[#11161C]/60 text-white/80 hover:border-cyan-500/50",
                    ].join(" ")}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1,
                      ),
                  )
                }
                className="rounded-lg border border-[#242B33] bg-[#11161C]/60 px-2 py-1.5 text-[11px] font-bold text-white/80 transition hover:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-2 sm:text-sm"
              >
                {t.next}
              </button>

              <button
                type="button"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    totalPages,
                  )
                }
                className="hidden rounded-lg border border-[#242B33] bg-[#11161C]/60 px-3 py-2 text-sm font-bold text-white/80 transition hover:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:block"
              >
                {t.last}
              </button>
            </nav>
          ) : null}
        </>
      )}
          {filteredFixtures.length > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {loadMoreError ? (
            <p
              role="alert"
              className="text-center text-sm font-semibold text-rose-300"
            >
              {loadMoreError}
            </p>
          ) : null}

          {hasMoreUpcoming ? (
            <button
              type="button"
              onClick={loadMoreUpcoming}
              disabled={isLoadingMore}
              className="min-w-[220px] rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore
                ? t.loadingMore
                : t.loadMore}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


