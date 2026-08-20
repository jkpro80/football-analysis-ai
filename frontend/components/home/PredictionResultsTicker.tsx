"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/context/locale-context";

type ResultTeam = {
  id: number;
  name: string;
  logo_url: string | null;
};

type PredictionResult = {
  source:
    | "live_prediction"
    | "historical_backtest";

  match_id: number;
  match_date: string;

  home_team: ResultTeam;
  away_team: ResultTeam;

  actual_home_score: number;
  actual_away_score: number;

  predicted_score: string | null;

  result_prediction_correct: boolean;
  exact_score_correct: boolean;

  confidence_score: number | null;
  correct_pick_label: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

function translateCorrectPickLabel(
  label: string | null,
  locale: "ar" | "sv" | "en",
): string {
  if (!label) {
    return "—";
  }

  const value = label.trim();

  // Team win labels produced by the historical backtest.
  if (value.startsWith("فوز ")) {
    const teamName = value.slice(4).trim();

    if (locale === "sv") {
      return `${teamName} vinner`;
    }

    if (locale === "en") {
      return `${teamName} Win`;
    }

    return `فوز ${teamName}`;
  }

  // Goals markets.
  if (value === "أكثر من 2.5 هدف") {
    if (locale === "sv") {
      return "Över 2,5 mål";
    }

    if (locale === "en") {
      return "Over 2.5 Goals";
    }

    return "أكثر من 2.5 هدف";
  }

  if (value === "أقل من 2.5 هدف") {
    if (locale === "sv") {
      return "Under 2,5 mål";
    }

    if (locale === "en") {
      return "Under 2.5 Goals";
    }

    return "أقل من 2.5 هدف";
  }

  // Preserve unknown future market labels instead of corrupting them.
  return value;
}
export default function PredictionResultsTicker() {
  const {
    locale,
    direction,
  } = useLocale();

  const [results, setResults] = useState<
    PredictionResult[]
  >([]);

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/prediction-results/correct?limit=20`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        const data =
          (await response.json()) as PredictionResult[];

        if (active) {
          setResults(data);
        }
      } catch {
        // Keep current data if API is temporarily unavailable.
      }
    }

    void loadResults();

    const timer = window.setInterval(
      loadResults,
      60_000,
    );

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const source = results[0]?.source;

  const t =
    locale === "ar"
      ? {
          historicalResults:
            "نتائج الاختبار التاريخي",
          recentCorrect:
            "التوقعات الصحيحة الأخيرة",
          correctPredictions:
            "التوقعات الصحيحة",
          empty:
            "ستظهر هنا النتائج الصحيحة تلقائيًا.",
          correctPrediction:
            "التوقع الصحيح",
          correct:
            "صحيح ✓",
          confidence:
            "الثقة",
        }
      : locale === "sv"
        ? {
            historicalResults:
              "Historiska testresultat",
            recentCorrect:
              "Senaste korrekta prognoser",
            correctPredictions:
              "Korrekta prognoser",
            empty:
              "Korrekta resultat visas automatiskt här.",
            correctPrediction:
              "Korrekt prognos",
            correct:
              "Rätt ✓",
            confidence:
              "Säkerhet",
          }
        : {
            historicalResults:
              "Historical Test Results",
            recentCorrect:
              "Latest Correct Predictions",
            correctPredictions:
              "Correct Predictions",
            empty:
              "Correct results will appear here automatically.",
            correctPrediction:
              "Correct Prediction",
            correct:
              "Correct ✓",
            confidence:
              "Confidence",
          };

  const title =
    source === "historical_backtest"
      ? t.historicalResults
      : t.recentCorrect;

  const tickerItems = useMemo(
    () => [...results, ...results],
    [results],
  );

  if (results.length === 0) {
    return (
      <div dir={direction} className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
        <div className="flex h-11 items-center">
          <div className="shrink-0 border-l border-emerald-500/20 bg-emerald-500/10 px-4 text-xs font-black text-emerald-300">
            {t.correctPredictions}
          </div>

          <div className="px-4 text-xs text-slate-500">
            {t.empty}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={direction} className="mt-6 overflow-hidden rounded-xl border border-emerald-500/20 bg-slate-950/70">
      <div className="flex h-12 items-center">
        <div className="relative z-10 flex h-full shrink-0 items-center gap-2 border-l border-emerald-500/20 bg-[#071023] px-4">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="whitespace-nowrap text-xs font-black text-emerald-300">
            {title}
          </span>
        </div>

        <div
          dir="ltr"
          className="relative flex-1 overflow-hidden"
        >
          <div className="prediction-ticker-track flex w-max items-center">
            {tickerItems.map(
              (result, index) => (
                <Link
                  key={`${result.match_id}-${index}`}
                  href={`/matches/${result.match_id}`}
                  className="mx-2 flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:bg-slate-800/70"
                >
                  <span className="font-bold text-slate-200">
                    {result.home_team.name}
                  </span>

                  <span className="font-black text-white">
                    {result.actual_home_score}
                    {" - "}
                    {result.actual_away_score}
                  </span>

                  <span className="font-bold text-slate-200">
                    {result.away_team.name}
                  </span>

                  <span className="font-bold text-slate-300">
                    {t.correctPrediction}
                  </span>

                  <span className="text-sm font-black text-cyan-300">
                    {translateCorrectPickLabel(result.correct_pick_label, locale)}
                  </span>

                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-black text-emerald-300">
                    {t.correct}
                  </span>

                  {result.confidence_score !== null ? (
                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 font-bold text-violet-200">
                      {t.confidence}: {result.confidence_score}%
                    </span>
                  ) : null}

                  <span className="mx-2 text-slate-700">
                    ●
                  </span>
                </Link>
              ),
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes predictionTickerMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .prediction-ticker-track {
          animation:
            predictionTickerMove
            110s
            linear
            infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
