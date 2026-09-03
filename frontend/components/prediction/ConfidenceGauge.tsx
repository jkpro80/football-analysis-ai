"use client";

import { useLocale } from "@/context/locale-context";

type ConfidenceGaugeProps = {
  value: number;
  level: string;
  model?: string;
};

const CONFIDENCE_TEXT = {
  ar: {
    confidenceIndex: "مؤشر الثقة",
    outOf100: "من 100",
    confidence: "ثقة",
    veryStrong: "قوية جدًا",
    strong: "قوية",
    medium: "متوسطة",
    low: "منخفضة",
  },

  en: {
    confidenceIndex: "Confidence Index",
    outOf100: "out of 100",
    confidence: "Confidence",
    veryStrong: "Very High",
    strong: "High",
    medium: "Medium",
    low: "Low",
  },

  sv: {
    confidenceIndex: "Konfidensindex",
    outOf100: "av 100",
    confidence: "Konfidens",
    veryStrong: "Mycket hög",
    strong: "Hög",
    medium: "Medel",
    low: "Låg",
  },
} as const;

export default function ConfidenceGauge({
  value,
  level,
  model,
}: ConfidenceGaugeProps) {
  const { locale, direction } = useLocale();
  const text = CONFIDENCE_TEXT[locale];

  const safeValue = Math.min(
    Math.max(Number(value) || 0, 0),
    100,
  );

  const confidenceStyle =
    safeValue >= 80
      ? {
          label: text.veryStrong,
          ringColor: "#34d399",
          borderClass: "border-emerald-500/30",
          backgroundClass: "bg-emerald-950/15",
          textClass: "text-emerald-300",
        }
      : safeValue >= 60
        ? {
            label: text.strong,
            ringColor: "#34d399",
            borderClass: "border-emerald-500/30",
            backgroundClass: "bg-emerald-950/15",
            textClass: "text-emerald-300",
          }
        : safeValue >= 40
          ? {
              label: text.medium,
              ringColor: "#fbbf24",
              borderClass: "border-amber-500/30",
              backgroundClass: "bg-amber-950/15",
              textClass: "text-amber-300",
            }
          : {
              label: text.low,
              ringColor: "#fb7185",
              borderClass: "border-rose-500/30",
              backgroundClass: "bg-rose-950/15",
              textClass: "text-rose-300",
            };

  return (
    <div
      dir={direction}
      className={[
        "rounded-2xl border p-5 text-center shadow-[0_12px_35px_rgba(0,0,0,0.12)]",
        confidenceStyle.borderClass,
        confidenceStyle.backgroundClass,
      ].join(" ")}
    >
      <p className="text-sm font-bold text-slate-400">
        {text.confidenceIndex}
      </p>

      <div
        className="mx-auto mt-4 flex h-32 w-32 items-center justify-center rounded-full p-3"
        style={{
          background: `conic-gradient(${confidenceStyle.ringColor} ${safeValue}%, #1e293b 0)`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#050b1e]">
          <span
            className={[
              "text-3xl font-black",
              confidenceStyle.textClass,
            ].join(" ")}
          >
            {safeValue.toFixed(0)}
          </span>

          <span className="text-xs text-slate-500">
            {text.outOf100}
          </span>
        </div>
      </div>

      <p
        className={[
          "mt-5 font-bold",
          confidenceStyle.textClass,
        ].join(" ")}
      >
        {text.confidence} {confidenceStyle.label}
      </p>

      {model && (
        <p className="mt-2 text-xs text-slate-600">
          {model}
        </p>
      )}
    </div>
  );
}
