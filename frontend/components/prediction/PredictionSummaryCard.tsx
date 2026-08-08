type PredictionSummaryCardProps = {
  winner: string;
  winnerProbability: number;
  score: string;
  scoreProbability: number;
  expectedGoals: number;
  expectedCorners: number | null;
  expectedYellowCards: number | null;
  confidence: number;
};

type SummaryItemProps = {
  icon: string;
  title: string;
  value: string;
  note?: string;
  className: string;
};

function confidenceLabel(value: number): string {
  if (value >= 70) {
    return "عالية";
  }

  if (value >= 45) {
    return "متوسطة";
  }

  return "منخفضة";
}

function confidenceIcon(value: number): string {
  if (value >= 70) {
    return "🟢";
  }

  if (value >= 45) {
    return "🟡";
  }

  return "🔴";
}

function confidenceStyle(value: number) {
  if (value >= 80) {
    return {
      label: "قوية جداً",
      icon: "🔵",
      card: "border-sky-500/25 text-sky-300",
      reading: "ثقة قوية جداً",
    };
  }

  if (value >= 60) {
    return {
      label: "قوية",
      icon: "🟢",
      card: "border-emerald-500/25 text-emerald-300",
      reading: "ثقة قوية",
    };
  }

  if (value >= 40) {
    return {
      label: "متوسطة",
      icon: "🟡",
      card: "border-amber-500/25 text-amber-300",
      reading: "ثقة متوسطة",
    };
  }

  return {
    label: "منخفضة",
    icon: "🔴",
    card: "border-rose-500/25 text-rose-300",
    reading: "ثقة منخفضة",
  };
}


function SummaryItem({
  icon,
  title,
  value,
  note,
  className,
}: SummaryItemProps) {
  return (
    <article
      className={`rounded-2xl border bg-slate-950/55 p-5 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
        <span aria-hidden="true">
          {icon}
        </span>

        <span>
          {title}
        </span>
      </div>

      <p className="mt-3 text-2xl font-black">
        {value}
      </p>

      {note && (
        <p className="mt-1 text-sm text-slate-500">
          {note}
        </p>
      )}
    </article>
  );
}

export default function PredictionSummaryCard({
  winner,
  winnerProbability,
  score,
  scoreProbability,
  expectedGoals,
  expectedCorners,
  expectedYellowCards,
  confidence,
}: PredictionSummaryCardProps) {

  const confidenceInfo = confidenceStyle(confidence);

  return (
    <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-400">
            نظرة سريعة
          </p>

          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            نظرة سريعة على المباراة
          </h2>
        </div>

        <span className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3 py-1 text-xs font-bold text-cyan-300">
          أهم الأرقام
        </span>
      </div>

      <article className="mb-4 rounded-3xl border border-emerald-500/25 bg-gradient-to-l from-emerald-950/25 to-slate-950/60 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <span aria-hidden="true">
                🏆
              </span>

              الفريق الأقرب للفوز
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-300 sm:text-4xl">
              {winner}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              أعلى احتمال بين نتائج المباراة
            </p>
          </div>

          <div className="min-w-32 rounded-2xl border border-emerald-500/20 bg-slate-950/50 px-5 py-4 text-center">
            <p className="text-3xl font-black text-emerald-300">
              {winnerProbability.toFixed(1)}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              احتمال الفوز
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, winnerProbability),
              )}%`,
            }}
          />
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryItem
          icon="🎯"
          title="النتيجة الأكثر احتمالًا"
          value={score}
          note={`${scoreProbability.toFixed(1)}%`}
          className="border-violet-500/25 text-violet-300"
        />

        <SummaryItem
          icon="⚽"
          title="إجمالي الأهداف المتوقع"
          value={expectedGoals.toFixed(2)}
          note="هدف"
          className="border-sky-500/25 text-sky-300"
        />

        <SummaryItem
          icon="🚩"
          title="الركنيات المتوقعة"
          value={
            expectedCorners === null
              ? "غير متاح"
              : expectedCorners.toFixed(2)
          }
          note={
            expectedCorners === null
              ? undefined
              : "ركنية"
          }
          className="border-cyan-500/25 text-cyan-300"
        />

        <SummaryItem
          icon="🟨"
          title="البطاقات الصفراء"
          value={
            expectedYellowCards === null
              ? "غير متاح"
              : expectedYellowCards.toFixed(2)
          }
          note={
            expectedYellowCards === null
              ? undefined
              : "بطاقة"
          }
          className="border-amber-500/25 text-amber-300"
        />

        <SummaryItem
          icon={confidenceInfo.icon}
          title="مستوى الثقة"
          value={confidenceInfo.label}
          note={`${confidence.toFixed(0)}%`}
          className={confidenceInfo.card}
        />

        <SummaryItem
          icon="📊"
          title="قراءة النموذج"
          value={confidenceInfo.reading}
          note="راجع التفاصيل قبل الاعتماد على التوقع"
          className="border-slate-700 text-slate-200"
        />
      </div>
    </section>
  );
}
