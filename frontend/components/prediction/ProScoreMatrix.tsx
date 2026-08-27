"use client";

import { useLocale } from "@/context/locale-context";
import ScoreMatrixHeatmap from "@/components/prediction/ScoreMatrixHeatmap";

type ScoreMatrixCell = {
  home_goals: number;
  away_goals: number;
  score: string;
  probability: number;
};

type ProScoreMatrixProps = {
  matrix?: ScoreMatrixCell[] | null;
  mostLikelyScore?: string | null;
  recommendedScore?: string | null;
  homeWin?: number;
  draw?: number;
  awayWin?: number;
};

const PRO_SCORE_MATRIX_TEXT = {
  ar: {
    title: "خريطة احتمالات النتائج",
    unavailable: "خريطة احتمالات النتائج غير متوفرة لهذه المباراة.",
  },
  en: {
    title: "Score Probability Matrix",
    unavailable: "The score probability matrix is unavailable for this match.",
  },
  sv: {
    title: "Resultatmatris",
    unavailable: "Resultatmatrisen är inte tillgänglig för den här matchen.",
  },
} as const;

export default function ProScoreMatrix({
  matrix = [],
  mostLikelyScore,
  recommendedScore,
  homeWin = 0,
  draw = 0,
  awayWin = 0,
}: ProScoreMatrixProps) {
  const { locale, direction } = useLocale();
  const text = PRO_SCORE_MATRIX_TEXT[locale];

  if (!Array.isArray(matrix) || matrix.length === 0) {
    return (
      <section
        dir={direction}
        className="rounded-[32px] border border-violet-500/20 bg-[#050b1e] p-6 sm:p-8"
      >
        <h2 className="text-xl font-black text-white">
          {text.title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-400">
          {text.unavailable}
        </p>
      </section>
    );
  }

  return (
    <ScoreMatrixHeatmap
      matrix={matrix}
      mostLikelyScore={mostLikelyScore}
      recommendedScore={recommendedScore}
      homeWin={homeWin}
      draw={draw}
      awayWin={awayWin}
    />
  );
}
