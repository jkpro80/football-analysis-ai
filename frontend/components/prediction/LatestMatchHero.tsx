"use client";

import MatchHero from "@/components/dashboard/MatchHero";
import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

export type LatestHeroTeam = {
  id: number;
  sportmonks_id?: number;
  name: string;
  country?: string;
  logo?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
  [key: string]: unknown;
};

type PredictionEvaluation = {
  available: boolean;
  reason?: string | null;

  actual_score?: {
    home?: number;
    away?: number;
    total?: number;
  } | null;

  predicted_score?: {
    home?: number | null;
    away?: number | null;
    score?: string | null;
  } | null;

  actual_outcome?: string | null;
  predicted_outcome?: string | null;

  winner_correct?: boolean | null;
  exact_score_correct?: boolean | null;

  btts?: {
    predicted?: boolean;
    actual?: boolean;
    correct?: boolean;
    yes_probability?: number;
    no_probability?: number;
  };

  over_2_5?: {
    predicted?: boolean;
    actual?: boolean;
    correct?: boolean;
    over_probability?: number;
    under_probability?: number;
  };

  correct_checks?: number;
  total_checks?: number;
  accuracy_percentage?: number | null;
};

type LatestMatchHeroProps = {
  matchId: number;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isFinished?: boolean;
  actualOutcome?: string | null;
  evaluation?: PredictionEvaluation;
  matchDate: string;
  leagueName?: string | null;
  venueName?: string | null;
  homeTeam: LatestHeroTeam;
  awayTeam: LatestHeroTeam;
  homeExpectedGoals: number;
  awayExpectedGoals: number;
  totalExpectedGoals: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  mostLikelyScore: string;
  scoreProbability: number;
};

function translateMatchStatus(
  status: string,
  locale: Locale,
): string {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  const statuses: Record<
    Locale,
    Record<string, string>
  > = {
    ar: {
      "1": "لم تبدأ",
      "2": "قريبًا",
      "3": "الشوط الأول",
      "4": "استراحة",
      "5": "انتهت",
      "6": "مؤجلة",
      "7": "ملغاة",
      "8": "بعد الوقت الأصلي",
      "9": "بعد الأشواط الإضافية",
      "10": "ركلات ترجيح",
      scheduled: "مجدولة",
      not_started: "لم تبدأ",
      pending: "قريبًا",
      live: "مباشر",
      inplay: "مباشر",
      "in-play": "مباشر",
      halftime: "استراحة",
      ht: "استراحة",
      finished: "انتهت",
      completed: "انتهت",
      ft: "انتهت",
      postponed: "مؤجلة",
      cancelled: "ملغاة",
      canceled: "ملغاة",
      abandoned: "متوقفة",
    },

    en: {
      "1": "Not Started",
      "2": "Upcoming",
      "3": "First Half",
      "4": "Half Time",
      "5": "Finished",
      "6": "Postponed",
      "7": "Cancelled",
      "8": "After Regular Time",
      "9": "After Extra Time",
      "10": "Penalties",
      scheduled: "Scheduled",
      not_started: "Not Started",
      pending: "Upcoming",
      live: "Live",
      inplay: "Live",
      "in-play": "Live",
      halftime: "Half Time",
      ht: "Half Time",
      finished: "Finished",
      completed: "Finished",
      ft: "Finished",
      postponed: "Postponed",
      cancelled: "Cancelled",
      canceled: "Cancelled",
      abandoned: "Abandoned",
    },

    sv: {
      "1": "Ej startad",
      "2": "Kommande",
      "3": "Första halvlek",
      "4": "Halvtid",
      "5": "Avslutad",
      "6": "Uppskjuten",
      "7": "Inställd",
      "8": "Efter ordinarie tid",
      "9": "Efter förlängning",
      "10": "Straffar",
      scheduled: "Schemalagd",
      not_started: "Ej startad",
      pending: "Kommande",
      live: "Live",
      inplay: "Live",
      "in-play": "Live",
      halftime: "Halvtid",
      ht: "Halvtid",
      finished: "Avslutad",
      completed: "Avslutad",
      ft: "Avslutad",
      postponed: "Uppskjuten",
      cancelled: "Inställd",
      canceled: "Inställd",
      abandoned: "Avbruten",
    },
  };

  return statuses[locale][normalized] ?? status;
}
export default function LatestMatchHero({
  matchId,
  status,
  homeScore,
  awayScore,
  isFinished,
  actualOutcome,
  evaluation,
  matchDate,
  leagueName,
  venueName,
  homeTeam,
  awayTeam,
  homeExpectedGoals,
  awayExpectedGoals,
  totalExpectedGoals,
  homeWin,
  draw,
  awayWin,
  mostLikelyScore,
  scoreProbability,
}: LatestMatchHeroProps) {
  const { locale } = useLocale();

  const translatedStatus = translateMatchStatus(
    status,
    locale,
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-300">
          {translatedStatus}
        </span>

        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-400">
          {matchDate}
        </span>
      </div>

      <MatchHero
        match={{
          id: matchId,
          date: matchDate,
          status: translatedStatus,
          home_score: homeScore,
          away_score: awayScore,
          is_finished: isFinished,
          actual_outcome: actualOutcome,
          league: leagueName,
          venue: venueName,
        }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        expectedGoals={{
          home: homeExpectedGoals,
          away: awayExpectedGoals,
          total: totalExpectedGoals,
        }}
        probabilities={{
          homeWin,
          draw,
          awayWin,
        }}
        mostLikelyScore={{
          score: mostLikelyScore,
          probability: scoreProbability,
        }}
        evaluation={evaluation}
      />
    </section>
  );
}

