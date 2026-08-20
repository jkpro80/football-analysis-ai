"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { apiFetch } from "@/lib/api";
import ScoreMatrixHeatmap from "@/components/prediction/ScoreMatrixHeatmap";

type ScoreMatrixCell = {
  home_goals: number;
  away_goals: number;
  score: string;
  probability: number;
};

type ProtectedPredictionResponse = {
  score_matrix?: ScoreMatrixCell[] | null;
};

type ProScoreMatrixProps = {
  matchId: number;
  mostLikelyScore?: string | null;
  recommendedScore?: string | null;
  homeWin?: number;
  draw?: number;
  awayWin?: number;
};

const PRO_SCORE_MATRIX_TEXT = {
  ar: {
    loginRequired:
      "سجّل الدخول للوصول إلى خريطة احتمالات النتائج.",
    loadError:
      "تعذر تحميل خريطة احتمالات النتائج.",
    loading:
      "جارٍ تحميل خريطة احتمالات النتائج...",
    title:
      "خريطة احتمالات النتائج",
    subscriptionPlans:
      "عرض خطط الاشتراك",
  },

  en: {
    loginRequired:
      "Sign in to access the score probability matrix.",
    loadError:
      "Unable to load the score probability matrix.",
    loading:
      "Loading score probability matrix...",
    title:
      "Score Probability Matrix",
    subscriptionPlans:
      "View Subscription Plans",
  },

  sv: {
    loginRequired:
      "Logga in för att få tillgång till resultatmatrisen.",
    loadError:
      "Det gick inte att ladda resultatmatrisen.",
    loading:
      "Laddar resultatmatrisen...",
    title:
      "Resultatmatris",
    subscriptionPlans:
      "Visa abonnemangsplaner",
  },
} as const;

export default function ProScoreMatrix({
  matchId,
  mostLikelyScore,
  recommendedScore,
  homeWin = 0,
  draw = 0,
  awayWin = 0,
}: ProScoreMatrixProps) {
  const { locale, direction } = useLocale();
  const text = PRO_SCORE_MATRIX_TEXT[locale];

  const {
    accessToken,
    isLoading: authLoading,
    isAuthenticated,
  } = useAuth();

  const [matrix, setMatrix] =
    useState<ScoreMatrixCell[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      setMatrix([]);
      setError(text.loginRequired);
      return;
    }

    let active = true;

    async function loadScoreMatrix() {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await apiFetch<ProtectedPredictionResponse>(
            `/predictions/${matchId}?include_score_matrix=true`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

        if (!active) {
          return;
        }

        setMatrix(
          Array.isArray(result.score_matrix)
            ? result.score_matrix
            : [],
        );
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setMatrix([]);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : text.loadError,
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadScoreMatrix();

    return () => {
      active = false;
    };
  }, [
    accessToken,
    authLoading,
    isAuthenticated,
    matchId,
    text.loginRequired,
    text.loadError,
  ]);

  if (authLoading || isLoading) {
    return (
      <section
        dir={direction}
        className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8"
      >
        <p className="text-center font-bold text-slate-400">
          {text.loading}
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section
        dir={direction}
        className="rounded-[32px] border border-violet-500/20 bg-[#050b1e] p-6 sm:p-8"
      >
        <h2 className="text-xl font-black text-white">
          {text.title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-400">
          {error}
        </p>

        <a
          href="/subscription"
          className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-500"
        >
          {text.subscriptionPlans}
        </a>
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
