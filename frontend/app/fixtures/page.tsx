import Link from "next/link";

import FixturesHeader from "@/components/fixtures/FixturesHeader";

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
    home_team?: string;
    away_team?: string;
    date?: string;
    status?: string;
  };

  predicted_score: string;

  best_pick: {
    key: string;
    label: string;
    probability: number;
  };

  confidence: {
    label: string;
    score: number;
  };

  expected_goals: {
    home: number;
    away: number;
    total: number;
  };

  prediction_record_id?: number;

  fixture?: {
    id: number;
    sportmonks_id?: number;
    date?: string;
    status?: string;
  };
};
async function getMatches(): Promise<MatchItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const response = await fetch(
    `${apiUrl}/matches?limit=100`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load matches.");
  }

  return response.json();
}

async function getPredictions(): Promise<PredictionItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const response = await fetch(
    `${apiUrl}/predictions/latest/upcoming?limit=100`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as
    | PredictionItem[]
    | {
        predictions?: PredictionItem[];
      };

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.predictions)
    ? data.predictions
    : [];
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

function getStatusLabel(status: string | null) {
  const normalizedStatus =
    status?.toLowerCase() ?? "";

  if (
    normalizedStatus.includes("live") ||
    normalizedStatus.includes("inplay")
  ) {
    return {
      label: "مباشر",
      className:
        "border-red-500/20 bg-red-500/10 text-red-300",
    };
  }

  if (
    normalizedStatus.includes("finished") ||
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("ended")
  ) {
    return {
      label: "منتهية",
      className:
        "border-slate-600 bg-slate-800 text-slate-300",
    };
  }

  if (
    normalizedStatus.includes("postponed") ||
    normalizedStatus.includes("cancelled")
  ) {
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

export default async function FixturesPage() {
  let matches: MatchItem[] = [];
  let predictions: PredictionItem[] = [];
  let errorMessage = "";

  try {
    [matches, predictions] = await Promise.all([
      getMatches(),
      getPredictions(),
    ]);
  } catch {
    errorMessage =
      "تعذر تحميل المباريات من الخادم.";
  }

  const predictionsByMatchId = new Map<number, PredictionItem>(
    predictions.map((prediction) => [
      prediction.match.id,
      prediction,
    ]),
  );

  return (

      <main
        dir="rtl"
        className="min-h-screen text-slate-100"
      >
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <FixturesHeader />

            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    قائمة المباريات
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    عرض المباريات المخزنة في قاعدة البيانات مع
                    إمكانية فتح صفحة التحليل.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {matches.length} مباراة
                </span>
              </div>

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                  <h3 className="font-bold text-red-300">
                    حدث خطأ
                  </h3>

                  <p className="mt-2 text-sm text-red-200/80">
                    {errorMessage}
                  </p>
                </div>
              ) : matches.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-10 text-center">
                  <h3 className="text-lg font-bold text-white">
                    لا توجد مباريات
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    قاعدة البيانات لا تحتوي حاليًا على مباريات
                    يمكن عرضها.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {matches.map((match) => {
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
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                                    {match.home_logo ? (
                                      <img
                                        src={match.home_logo}
                                        alt={`شعار ${match.home_team}`}
                                        width={32}
                                        height={32}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
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
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                                    {match.away_logo ? (
                                      <img
                                        src={match.away_logo}
                                        alt={`شعار ${match.away_team}`}
                                        width={32}
                                        height={32}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
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
                                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-slate-400">
                                    {match.league_logo && (
                                      <img
                                        src={match.league_logo}
                                        alt={`شعار ${match.league_name}`}
                                        width={18}
                                        height={18}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        className="h-[18px] w-[18px] object-contain"
                                      />
                                    )}

                                    {match.league_name}
                                  </span>
                                )}
                              </div>
                            </div>                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {hasScore && (
                              <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2">
                                <p className="text-[10px] text-slate-500">
                                  النتيجة
                                </p>

                                <span
                                  dir="ltr"
                                  className="text-lg font-black text-white tabular-nums"
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
                                    className="mt-1 font-black text-cyan-300 tabular-nums"
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
                                    className="mt-1 font-black text-violet-300 tabular-nums"
                                  >
                                    {Number(
                                      prediction.confidence.score,
                                    ).toFixed(1)}
                                    %
                                  </p>
                                </div>

                                <div className="min-w-[150px] rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                                  <p className="text-[10px] text-emerald-200/70">
                                    أفضل اختيار
                                  </p>

                                  <p className="mt-1 text-sm font-black text-emerald-300">
                                    {prediction.best_pick.label}
                                  </p>

                                  <p
                                    dir="ltr"
                                    className="mt-1 text-xs font-bold text-emerald-200 tabular-nums"
                                  >
                                    {Number(
                                      prediction.best_pick.probability,
                                    ).toFixed(1)}
                                    %
                                  </p>
                                </div>

                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center">
                                  <p className="text-[10px] text-amber-200/70">
                                    xG
                                  </p>

                                  <p
                                    dir="ltr"
                                    className="mt-1 text-sm font-black text-amber-300 tabular-nums"
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

                            <span className="text-sm font-semibold text-cyan-400 transition group-hover:text-cyan-300">
                              فتح التحليل
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

  );
}













