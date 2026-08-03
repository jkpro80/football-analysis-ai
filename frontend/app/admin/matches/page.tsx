type Match = {
  id: number;
  sportmonks_id: number | null;
  home_team: string;
  away_team: string;
  date: string;
  status: string;
};

type ModelStatus = {
  active_model: string;
  enabled: boolean;
  sample_size: number;
  updated_at: string | null;
  weights: {
    home_goal_multiplier: number;
    away_goal_multiplier: number;
    total_goal_multiplier: number;
    attack_multiplier: number;
    home_advantage_multiplier: number;
  };
};

type AccuracyReport = {
  model_version: string;
  evaluated_predictions: number;
  sample_status: string;
  accuracy?: {
    match_result: number;
    over_2_5: number;
    btts: number;
    exact_score: number;
  };
  mean_absolute_error?: {
    home_goals: number;
    away_goals: number;
    total_goals: number;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function fetchJson<T>(
  path: string,
): Promise<T | null> {
  try {
    const response = await fetch(
      `${API_URL}${path}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getMatches(): Promise<Match[]> {
  const data = await fetchJson<unknown>(
    "/matches",
  );

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const match = item as Record<
      string,
      unknown
    >;

    return {
      id: Number(match.id),
      sportmonks_id:
        match.sportmonks_id === null ||
        match.sportmonks_id === undefined
          ? null
          : Number(match.sportmonks_id),
      home_team: String(
        match.home_team ??
          match.home_team_name ??
          "Home Team",
      ),
      away_team: String(
        match.away_team ??
          match.away_team_name ??
          "Away Team",
      ),
      date: String(
        match.date ?? "",
      ),
      status: String(
        match.status ?? "unknown",
      ),
    };
  });
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return "غير محدد";
  }

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T") + "Z";

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ar-IQ",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatPercent(
  value: number | undefined,
): string {
  if (
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "—";
  }

  return `${value.toFixed(1)}%`;
}

export default async function HomePage() {
  const [
    modelStatus,
    accuracy,
    matches,
  ] = await Promise.all([
    fetchJson<ModelStatus>(
      "/model/status",
    ),
    fetchJson<AccuracyReport>(
      "/model/accuracy",
    ),
    getMatches(),
  ]);

  const visibleMatches = matches.slice(
    0,
    12,
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <p className="mb-2 text-sm font-medium text-emerald-400">
            Football Analysis AI
          </p>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            منصة تحليل وتوقع المباريات
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
            توقعات مبنية على الفورمة الحديثة،
            أداء الأرض والخارج، المواجهات
            المباشرة، Elo، نموذج Poisson،
            والمعايرة التلقائية.
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="النموذج الفعّال"
            value={
              modelStatus?.active_model ??
              "غير متاح"
            }
            subtitle={
              modelStatus?.enabled
                ? "المعايرة مفعّلة"
                : "المعايرة غير مفعّلة"
            }
          />

          <StatCard
            title="التوقعات المقيّمة"
            value={String(
              accuracy?.evaluated_predictions ??
                0,
            )}
            subtitle={
              accuracy?.sample_status ??
              "لا توجد بيانات"
            }
          />

          <StatCard
            title="دقة نتيجة المباراة"
            value={formatPercent(
              accuracy?.accuracy
                ?.match_result,
            )}
            subtitle="سوق 1X2"
          />

          <StatCard
            title="متوسط خطأ الأهداف"
            value={
              accuracy
                ?.mean_absolute_error
                ?.total_goals !== undefined
                ? accuracy
                    .mean_absolute_error
                    .total_goals
                    .toFixed(3)
                : "—"
            }
            subtitle="MAE مجموع الأهداف"
          />
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Over 2.5"
            value={formatPercent(
              accuracy?.accuracy
                ?.over_2_5,
            )}
          />

          <MetricCard
            title="BTTS"
            value={formatPercent(
              accuracy?.accuracy?.btts,
            )}
          />

          <MetricCard
            title="النتيجة الدقيقة"
            value={formatPercent(
              accuracy?.accuracy
                ?.exact_score,
            )}
          />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                المباريات
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                اختر مباراة لعرض التحليل
                الكامل والتوقعات.
              </p>
            </div>

            <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
              {matches.length} مباراة
            </span>
          </div>

          {visibleMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
              تعذر تحميل المباريات من
              الـBackend.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleMatches.map(
                (match) => (
                  <a
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:bg-slate-900"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                        {match.status}
                      </span>

                      <span className="text-xs text-slate-500">
                        #{match.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center">
                        <p className="text-lg font-semibold">
                          {match.home_team}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-emerald-400">
                        VS
                      </div>

                      <div className="flex-1 text-center">
                        <p className="text-lg font-semibold">
                          {match.away_team}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-800 pt-4 text-center text-sm text-slate-400">
                      {formatDate(match.date)}
                    </div>

                    <p className="mt-3 text-center text-sm font-medium text-emerald-400 opacity-0 transition group-hover:opacity-100">
                      عرض التحليل الكامل
                    </p>
                  </a>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 break-words text-2xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-emerald-400">
        {subtitle}
      </p>
    </article>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-center">
      <p className="text-sm text-slate-400">
        دقة {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </article>
  );
}