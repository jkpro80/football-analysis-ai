type Prediction = {
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
    over_2_5: number;
    under_2_5: number;
    btts: number;
    no_btts: number;
  };

  confidence: {
    label: string;
    score: number;
  };
};

type Props = {
  predictions: Prediction[];
};

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: string;
  accentClass: string;
};

function StatCard({
  title,
  value,
  description,
  icon,
  accentClass,
}: StatCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-slate-700">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accentClass}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black text-white">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 text-xl">
          {icon}
        </div>
      </div>
    </article>
  );
}

function average(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce(
    (sum, value) => sum + Number(value ?? 0),
    0,
  );

  return total / values.length;
}

export default function StatsCards({
  predictions,
}: Props) {
  const totalPredictions = predictions.length;

  const highConfidenceCount = predictions.filter(
    (prediction) =>
      prediction.confidence.label === "high" ||
      prediction.confidence.label === "very_high",
  ).length;

  const averageConfidence = average(
    predictions.map(
      (prediction) =>
        prediction.confidence.score,
    ),
  );

  const averageBtts = average(
    predictions.map(
      (prediction) =>
        prediction.probabilities.btts,
    ),
  );

  return (
    <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="إجمالي التوقعات"
        value={totalPredictions}
        description="عدد المباريات القادمة المتاحة للتحليل"
        icon="⚽"
        accentClass="bg-cyan-500"
      />

      <StatCard
        title="توقعات عالية الثقة"
        value={highConfidenceCount}
        description="التوقعات المصنفة High أو Very High"
        icon="🏆"
        accentClass="bg-emerald-500"
      />

      <StatCard
        title="متوسط الثقة"
        value={`${averageConfidence.toFixed(1)}%`}
        description="متوسط تقييم ثقة النموذج في جميع المباريات"
        icon="🎯"
        accentClass="bg-amber-500"
      />

      <StatCard
        title="متوسط BTTS"
        value={`${averageBtts.toFixed(1)}%`}
        description="متوسط احتمال تسجيل الفريقين"
        icon="🔥"
        accentClass="bg-violet-500"
      />
    </section>
  );
}