type ConfidenceGaugeProps = {
  value: number;
  level: string;
  model?: string;
};

function confidenceArabic(level: string) {
  const values: Record<string, string> = {
    "Very Low": "منخفضة جدًا",
    Low: "منخفضة",
    Medium: "متوسطة",
    High: "مرتفعة",
    "Very High": "مرتفعة جدًا",
  };

  return values[level] ?? level;
}

export default function ConfidenceGauge({
  value,
  level,
  model,
}: ConfidenceGaugeProps) {
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);

  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-950/15 p-7 text-center">
      <p className="text-sm font-bold text-slate-400">
        مؤشر الثقة
      </p>

      <div
        className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full p-4"
        style={{
          background: `conic-gradient(#ef4444 ${safeValue}%, #1e293b 0)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#050b1e]">
          <span className="text-4xl font-black text-red-400">
            {safeValue.toFixed(0)}
          </span>
          <span className="text-xs text-slate-500">
            من 100
          </span>
        </div>
      </div>

      <p className="mt-5 font-bold text-red-400">
        ثقة {confidenceArabic(level)}
      </p>

      {model && (
        <p className="mt-2 text-xs text-slate-600">
          {model}
        </p>
      )}
    </div>
  );
}
