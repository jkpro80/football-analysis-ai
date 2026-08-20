"use client";

import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

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

const TEXT = {
  ar: {
    quickLook: "نظرة سريعة",
    quickLookTitle: "نظرة سريعة على المباراة",
    keyNumbers: "أهم الأرقام",
    closestToWin: "الفريق الأقرب للفوز",
    highestOutcomeProbability: "أعلى احتمال بين نتائج المباراة",
    winProbability: "احتمال الفوز",
    mostLikelyScore: "النتيجة الأكثر احتمالًا",
    expectedGoals: "إجمالي الأهداف المتوقع",
    goal: "هدف",
    expectedCorners: "الركنيات المتوقعة",
    corner: "ركنية",
    yellowCards: "البطاقات الصفراء",
    card: "بطاقة",
    unavailable: "غير متاح",
    confidenceLevel: "مستوى الثقة",
    modelReading: "قراءة النموذج",
    reviewDetails: "راجع التفاصيل قبل الاعتماد على التوقع",
    confidenceVeryStrong: "قوية جداً",
    confidenceStrong: "قوية",
    confidenceMedium: "متوسطة",
    confidenceLow: "منخفضة",
    readingVeryStrong: "ثقة قوية جداً",
    readingStrong: "ثقة قوية",
    readingMedium: "ثقة متوسطة",
    readingLow: "ثقة منخفضة",
  },
  en: {
    quickLook: "Quick Look",
    quickLookTitle: "Match Overview",
    keyNumbers: "Key Numbers",
    closestToWin: "Most Likely Winner",
    highestOutcomeProbability: "Highest probability among match outcomes",
    winProbability: "Win Probability",
    mostLikelyScore: "Most Likely Score",
    expectedGoals: "Expected Total Goals",
    goal: "Goal",
    expectedCorners: "Expected Corners",
    corner: "Corner",
    yellowCards: "Yellow Cards",
    card: "Card",
    unavailable: "Not Available",
    confidenceLevel: "Confidence Level",
    modelReading: "Model Reading",
    reviewDetails: "Review the details before relying on the prediction",
    confidenceVeryStrong: "Very Strong",
    confidenceStrong: "Strong",
    confidenceMedium: "Medium",
    confidenceLow: "Low",
    readingVeryStrong: "Very Strong Confidence",
    readingStrong: "Strong Confidence",
    readingMedium: "Medium Confidence",
    readingLow: "Low Confidence",
  },
  sv: {
    quickLook: "Snabb överblick",
    quickLookTitle: "Matchöversikt",
    keyNumbers: "Nyckeltal",
    closestToWin: "Troligaste vinnaren",
    highestOutcomeProbability: "Högsta sannolikheten bland matchutfallen",
    winProbability: "Vinstsannolikhet",
    mostLikelyScore: "Troligaste resultat",
    expectedGoals: "Förväntat totalt antal mål",
    goal: "Mål",
    expectedCorners: "Förväntade hörnor",
    corner: "Hörna",
    yellowCards: "Gula kort",
    card: "Kort",
    unavailable: "Inte tillgängligt",
    confidenceLevel: "Konfidensnivå",
    modelReading: "Modellbedömning",
    reviewDetails: "Granska detaljerna innan du förlitar dig på prognosen",
    confidenceVeryStrong: "Mycket stark",
    confidenceStrong: "Stark",
    confidenceMedium: "Medel",
    confidenceLow: "Låg",
    readingVeryStrong: "Mycket stark konfidens",
    readingStrong: "Stark konfidens",
    readingMedium: "Medelhög konfidens",
    readingLow: "Låg konfidens",
  },
} satisfies Record<Locale, Record<string, string>>;

function confidenceStyle(
  value: number,
  locale: Locale,
) {
  const text = TEXT[locale];

  if (value >= 80) {
    return {
      label: text.confidenceVeryStrong,
      icon: "🔵",
      card: "border-sky-500/25 text-sky-300",
      reading: text.readingVeryStrong,
    };
  }

  if (value >= 60) {
    return {
      label: text.confidenceStrong,
      icon: "🟢",
      card: "border-emerald-500/25 text-emerald-300",
      reading: text.readingStrong,
    };
  }

  if (value >= 40) {
    return {
      label: text.confidenceMedium,
      icon: "🟡",
      card: "border-amber-500/25 text-amber-300",
      reading: text.readingMedium,
    };
  }

  return {
    label: text.confidenceLow,
    icon: "🔴",
    card: "border-rose-500/25 text-rose-300",
    reading: text.readingLow,
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
  const { locale, direction } = useLocale();
  const text = TEXT[locale];
  const confidenceInfo = confidenceStyle(
    confidence,
    locale,
  );

  return (
    <section
      dir={direction}
      className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-5 shadow-2xl shadow-black/20 sm:p-7"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-cyan-400">
            {text.quickLook}
          </p>

          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            {text.quickLookTitle}
          </h2>
        </div>

        <span className="rounded-full border border-cyan-500/25 bg-cyan-950/30 px-3 py-1 text-xs font-bold text-cyan-300">
          {text.keyNumbers}
        </span>
      </div>

      <article className="mb-4 rounded-3xl border border-emerald-500/25 bg-gradient-to-l from-emerald-950/25 to-slate-950/60 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
              <span aria-hidden="true">
                🏆
              </span>

              {text.closestToWin}
            </p>

            <p className="mt-3 text-3xl font-black text-emerald-300 sm:text-4xl">
              {winner}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {text.highestOutcomeProbability}
            </p>
          </div>

          <div className="min-w-32 rounded-2xl border border-emerald-500/20 bg-slate-950/50 px-5 py-4 text-center">
            <p className="text-3xl font-black text-emerald-300">
              {winnerProbability.toFixed(1)}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {text.winProbability}
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
          title={text.mostLikelyScore}
          value={score}
          note={`${scoreProbability.toFixed(1)}%`}
          className="border-violet-500/25 text-violet-300"
        />

        <SummaryItem
          icon="⚽"
          title={text.expectedGoals}
          value={expectedGoals.toFixed(2)}
          note={text.goal}
          className="border-sky-500/25 text-sky-300"
        />

        <SummaryItem
          icon="🚩"
          title={text.expectedCorners}
          value={
            expectedCorners === null
              ? text.unavailable
              : expectedCorners.toFixed(2)
          }
          note={
            expectedCorners === null
              ? undefined
              : text.corner
          }
          className="border-cyan-500/25 text-cyan-300"
        />

        <SummaryItem
          icon="🟨"
          title={text.yellowCards}
          value={
            expectedYellowCards === null
              ? text.unavailable
              : expectedYellowCards.toFixed(2)
          }
          note={
            expectedYellowCards === null
              ? undefined
              : text.card
          }
          className="border-amber-500/25 text-amber-300"
        />

        <SummaryItem
          icon={confidenceInfo.icon}
          title={text.confidenceLevel}
          value={confidenceInfo.label}
          note={`${confidence.toFixed(0)}%`}
          className={confidenceInfo.card}
        />

        <SummaryItem
          icon="📊"
          title={text.modelReading}
          value={confidenceInfo.reading}
          note={text.reviewDetails}
          className="border-slate-700 text-slate-200"
        />
      </div>
    </section>
  );
}
