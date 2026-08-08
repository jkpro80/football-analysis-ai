"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MatchItem = {
  id: number;
  sportmonks_id: number | null;
  home_team_id: number;
  away_team_id: number;
  home_team: string;
  away_team: string;
  home_logo?: string | null;
  away_logo?: string | null;
  league_name?: string | null;
  league_logo?: string | null;
  date: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
};

type PredictionItem = {
  match: {
    id: number;
  };
  predicted_score: string;
  best_pick: {
    label: string;
    probability: number;
  };
  confidence: {
    score: number;
  };
  expected_goals: {
    home: number;
    away: number;
  };
};

type FilterType =
  | "all"
  | "upcoming"
  | "live"
  | "finished"
  | "nearest";

type FixturesListProps = {
  matches: MatchItem[];
  predictions: PredictionItem[];
};

function normalizeStatus(status: string | null) {
  return status?.trim().toLowerCase() ?? "";
}

function isLive(status: string | null) {
  const value = normalizeStatus(status);

  return (
    value.includes("live") ||
    value.includes("inplay") ||
    value.includes("in-play")
  );
}

function isFinished(status: string | null) {
  const value = normalizeStatus(status);

  return (
    value.includes("finished") ||
    value.includes("complete") ||
    value.includes("ended") ||
    value.includes("ft")
  );
}

function isPostponed(status: string | null) {
  const value = normalizeStatus(status);

  return (
    value.includes("postponed") ||
    value.includes("cancelled") ||
    value.includes("canceled")
  );
}

function isUpcoming(match: MatchItem) {
  return (
    !isLive(match.status) &&
    !isFinished(match.status) &&
    !isPostponed(match.status)
  );
}

function matchTimestamp(value: string) {
  const date = new Date(value);
  const time = date.getTime();

  return Number.isNaN(time)
    ? Number.MAX_SAFE_INTEGER
    : time;
}

function formatMatchDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "تاريخ غير متوفر",
      time: "--:--",
    };
  }

  return {
    date: new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date),

    time: new Intl.DateTimeFormat("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function dateKey(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateGroupLabel(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "تاريخ غير معروف";
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const difference = Math.round(
    (target.getTime() - today.getTime()) /
      86400000,
  );

  if (difference === 0) {
    return "اليوم";
  }

  if (difference === 1) {
    return "غدًا";
  }

  if (difference === -1) {
    return "أمس";
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
function getStatusLabel(status: string | null) {
  if (isLive(status)) {
    return {
      label: "مباشر",
      className:
        "border-red-500/20 bg-red-500/10 text-red-300",
    };
  }

  if (isFinished(status)) {
    return {
      label: "منتهية",
      className:
        "border-slate-600 bg-slate-800 text-slate-300",
    };
  }

  if (isPostponed(status)) {
    return {
      label: "مؤجلة",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: "قادمة",
    className:
      "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  };
}

export default function FixturesList({
  matches,
  predictions,
}: FixturesListProps) {
  const [filter, setFilter] =
    useState<FilterType>("all");

  const [search, setSearch] =
    useState("");

  const predictionsByMatchId = useMemo(
    () =>
      new Map(
        predictions.map((prediction) => [
          prediction.match.id,
          prediction,
        ]),
      ),
    [predictions],
  );

  const counts = useMemo(
    () => ({
      all: matches.length,
      upcoming: matches.filter(isUpcoming).length,
      live: matches.filter((match) =>
        isLive(match.status),
      ).length,
      finished: matches.filter((match) =>
        isFinished(match.status),
      ).length,
    }),
    [matches],
  );

  const filteredMatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = Date.now();

    let result = matches.filter((match) => {
      if (
        filter === "upcoming" &&
        !isUpcoming(match)
      ) {
        return false;
      }

      if (
        filter === "live" &&
        !isLive(match.status)
      ) {
        return false;
      }

      if (
        filter === "finished" &&
        !isFinished(match.status)
      ) {
        return false;
      }

      if (
        filter === "nearest" &&
        (
          !isUpcoming(match) ||
          matchTimestamp(match.date) < now
        )
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        match.home_team,
        match.away_team,
        match.league_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    if (filter === "nearest") {
      result = [...result]
        .sort(
          (first, second) =>
            matchTimestamp(first.date) -
            matchTimestamp(second.date),
        )
        .slice(0, 10);
    }

    return result;
  }, [filter, matches, search]);

  const groupedMatches = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string;
        matches: MatchItem[];
      }
    >();

    for (const match of filteredMatches) {
      const key = dateKey(match.date);

      const current = groups.get(key);

      if (current) {
        current.matches.push(match);
      } else {
        groups.set(key, {
          label: dateGroupLabel(match.date),
          matches: [match],
        });
      }
    }

    return Array.from(groups.entries())
      .sort(([firstKey], [secondKey]) => {
        if (firstKey === "unknown") {
          return 1;
        }

        if (secondKey === "unknown") {
          return -1;
        }

        return firstKey.localeCompare(secondKey);
      })
      .map(([key, value]) => ({
        key,
        ...value,
        matches: [...value.matches].sort(
          (first, second) =>
            matchTimestamp(first.date) -
            matchTimestamp(second.date),
        ),
      }));
  }, [filteredMatches]);
  const filters: Array<{
    key: FilterType;
    label: string;
    count?: number;
  }> = [
    {
      key: "all",
      label: "الكل",
      count: counts.all,
    },
    {
      key: "upcoming",
      label: "القادمة",
      count: counts.upcoming,
    },
    {
      key: "live",
      label: "المباشرة",
      count: counts.live,
    },
    {
      key: "finished",
      label: "المنتهية",
      count: counts.finished,
    },
    {
      key: "nearest",
      label: "الأقرب",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              قائمة المباريات
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              فلترة المباريات حسب الحالة والبحث باسم الفريق أو الدوري.
            </p>
          </div>

          <span className="w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            {filteredMatches.length} مباراة
          </span>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const active =
                filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setFilter(item.key)
                  }
                  className={[
                    "rounded-xl border px-4 py-2 text-sm font-bold transition",
                    active
                      ? "border-cyan-400 bg-cyan-500 text-slate-950"
                      : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300",
                  ].join(" ")}
                >
                  {item.label}

                  {typeof item.count === "number" && (
                    <span
                      dir="ltr"
                      className="mr-2 text-xs opacity-75"
                    >
                      ({item.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="w-full xl:max-w-sm">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث باسم الفريق أو الدوري..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10"
            />
          </div>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
          <h3 className="text-lg font-bold text-white">
            لا توجد مباريات مطابقة
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            جرّب تغيير الفلتر أو حذف عبارة البحث.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groupedMatches.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-base font-black text-white">
                  {group.label}
                </h3>

                <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-bold text-slate-400">
                  {group.matches.length} مباراة
                </span>

                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <div className="grid gap-4">
                {group.matches.map((match) => {
            const prediction =
              predictionsByMatchId.get(match.id);

            const formattedDate =
              formatMatchDate(match.date);

            const status =
              getStatusLabel(match.status);

            const hasScore =
              match.home_score !== null &&
              match.away_score !== null;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="group rounded-2xl border border-slate-800 bg-slate-950/40 p-5 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-slate-900"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="min-w-20 text-center">
                      <p className="text-sm font-bold text-white">
                        {formattedDate.time}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formattedDate.date}
                      </p>
                    </div>

                    <div className="h-12 w-px bg-slate-800" />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                            {match.home_logo ? (
                              <img
                                src={match.home_logo}
                                alt={`شعار ${match.home_team}`}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <span className="text-xs font-black text-cyan-300">
                                {match.home_team
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white sm:text-lg">
                            {match.home_team}
                          </h3>
                        </div>

                        <span className="text-sm text-slate-500">
                          ضد
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                            {match.away_logo ? (
                              <img
                                src={match.away_logo}
                                alt={`شعار ${match.away_team}`}
                                width={32}
                                height={32}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <span className="text-xs font-black text-violet-300">
                                {match.away_team
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white sm:text-lg">
                            {match.away_team}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>
                          رقم المباراة: {match.id}
                        </span>

                        {match.league_name && (
                          <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-slate-400">
                            {match.league_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {hasScore && (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2">
                        <p className="text-[10px] text-slate-500">
                          النتيجة
                        </p>

                        <span
                          dir="ltr"
                          className="text-lg font-black text-white"
                        >
                          {match.home_score}
                          {" - "}
                          {match.away_score}
                        </span>
                      </div>
                    )}

                    {prediction && (
                      <>
                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-center">
                          <p className="text-[10px] text-cyan-200/70">
                            النتيجة المتوقعة
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 font-black text-cyan-300"
                          >
                            {prediction.predicted_score}
                          </p>
                        </div>

                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-center">
                          <p className="text-[10px] text-violet-200/70">
                            الثقة
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 font-black text-violet-300"
                          >
                            {Number(
                              prediction.confidence.score,
                            ).toFixed(1)}
                            %
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                          <p className="text-[10px] text-emerald-200/70">
                            أفضل اختيار
                          </p>

                          <p className="mt-1 text-sm font-black text-emerald-300">
                            {prediction.best_pick.label}
                          </p>
                        </div>

                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center">
                          <p className="text-[10px] text-amber-200/70">
                            xG
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 text-sm font-black text-amber-300"
                          >
                            {Number(
                              prediction.expected_goals.home,
                            ).toFixed(2)}
                            {" - "}
                            {Number(
                              prediction.expected_goals.away,
                            ).toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>

                    <span className="text-sm font-semibold text-cyan-400">
                      فتح التحليل
                    </span>
                  </div>
                </div>
              </Link>
            );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

