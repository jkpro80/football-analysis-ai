"use client";

import { useMemo, useState } from "react";

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
};

export default function MatchExplorer({
  fixtures,
}: MatchExplorerProps) {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [sortOption, setSortOption] =
    useState<SortOption>("confidence");

  const [quickFilter, setQuickFilter] =
    useState<QuickFilter>("all");

  const filteredFixtures = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    const result = fixtures.filter((fixture) => {
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

      const matchesQuick = matchesQuickFilter(
        fixture,
        quickFilter,
      );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesQuick
      );
    });

    return [...result].sort((first, second) => {
      if (sortOption === "confidence") {
        return (
          (second.confidence?.score ?? 0) -
          (first.confidence?.score ?? 0)
        );
      }

      if (sortOption === "best-pick") {
        return (
          (second.bestPick?.probability ?? 0) -
          (first.bestPick?.probability ?? 0)
        );
      }

      const firstDate =
        normalizeDate(first.date)?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      const secondDate =
        normalizeDate(second.date)?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      return firstDate - secondDate;
    });
  }, [
    fixtures,
    search,
    statusFilter,
    sortOption,
    quickFilter,
  ]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOption("confidence");
    setQuickFilter("all");
  };

  const hasActiveFilters =
    search.length > 0 ||
    statusFilter !== "all" ||
    quickFilter !== "all";

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
          MATCH EXPLORER
        </p>

        <h2 className="mt-2 text-3xl font-black">
          استكشاف المباريات
        </h2>

        <p className="mt-2 text-slate-500">
          ابحث عن فريق، واختر نوع التوقع، ورتّب
          النتائج وفق الثقة أو التاريخ.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {QUICK_FILTERS.map((filter) => {
          const isActive =
            quickFilter === filter.key;

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() =>
                setQuickFilter(filter.key)
              }
              className={[
                "rounded-full border px-4 py-2 text-sm font-bold transition",
                isActive
                  ? "border-cyan-400 bg-cyan-500 text-slate-950"
                  : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-cyan-500/50",
              ].join(" ")}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/50 p-5 lg:grid-cols-[1fr_auto_auto]">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="ابحث باسم الفريق..."
          className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as StatusFilter,
            )
          }
          className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none focus:border-cyan-500"
        >
          <option value="all">
            جميع الحالات
          </option>

          <option value="scheduled">
            مجدولة
          </option>

          <option value="live">
            مباشرة
          </option>

          <option value="finished">
            منتهية
          </option>
        </select>

        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(
              event.target.value as SortOption,
            )
          }
          className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none focus:border-cyan-500"
        >
          <option value="confidence">
            ترتيب حسب الثقة
          </option>

          <option value="best-pick">
            ترتيب حسب أفضل توقع
          </option>

          <option value="date">
            ترتيب حسب التاريخ
          </option>
        </select>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          عدد النتائج:{" "}
          <strong className="text-white">
            {filteredFixtures.length}
          </strong>
        </p>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
          >
            مسح البحث والفلاتر
          </button>
        ) : null}
      </div>

      {filteredFixtures.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-950/10 p-8">
          <h3 className="text-xl font-black text-amber-300">
            لا توجد مباريات مطابقة
          </h3>

          <p className="mt-3 text-slate-400">
            غيّر عبارة البحث أو اختر فلترًا مختلفًا.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
            />
          ))}
        </div>
      )}
    </section>
  );
}