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
  const safeValue = Math.min(
    Math.max(Number(value) || 0, 0),
    100,
  );

  const confidenceStyle =
    safeValue >= 80
      ? {
          label: "قوية جدًا",
          ringColor: "#38bdf8",
          borderClass: "border-sky-500/30",
          backgroundClass: "bg-sky-950/15",
          textClass: "text-sky-300",
        }
      : safeValue >= 60
        ? {
            label: "قوية",
            ringColor: "#34d399",
            borderClass: "border-emerald-500/30",
            backgroundClass: "bg-emerald-950/15",
            textClass: "text-emerald-300",
          }
        : safeValue >= 40
          ? {
              label: "متوسطة",
              ringColor: "#fbbf24",
              borderClass: "border-amber-500/30",
              backgroundClass: "bg-amber-950/15",
              textClass: "text-amber-300",
            }
          : {
              label: "منخفضة",
              ringColor: "#fb7185",
              borderClass: "border-rose-500/30",
              backgroundClass: "bg-rose-950/15",
              textClass: "text-rose-300",
            };

  return (
    <div
      className={[
        "rounded-3xl border p-7 text-center",
        confidenceStyle.borderClass,
        confidenceStyle.backgroundClass,
      ].join(" ")}
    >
      <p className="text-sm font-bold text-slate-400">
        مؤشر الثقة
      </p>

      <div
        className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full p-4"
        style={{
          background: `conic-gradient(${confidenceStyle.ringColor} ${safeValue}%, #1e293b 0)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#050b1e]">
          <span
            className={[
              "text-4xl font-black",
              confidenceStyle.textClass,
            ].join(" ")}
          >
            {safeValue.toFixed(0)}
          </span>
          <span className="text-xs text-slate-500">
            من 100
          </span>
        </div>
      </div>

      <p
        className={[
          "mt-5 font-bold",
          confidenceStyle.textClass,
        ].join(" ")}
      >
        ثقة {confidenceStyle.label}
      </p>

      {model && (
        <p className="mt-2 text-xs text-slate-600">
          {model}
        </p>
      )}
    </div>
  );
}
