import MatchHero from "@/components/dashboard/MatchHero";

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
  engineVersion: string;
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

function translateMatchStatus(status: string): string {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  const statuses: Record<string, string> = {
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
  };

  return statuses[normalized] ?? status;
}
export default function LatestMatchHero({
  matchId,
  status,
  homeScore,
  awayScore,
  isFinished,
  actualOutcome,
  evaluation,
  engineVersion,
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
  const translatedStatus = translateMatchStatus(status);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-300">
          {translatedStatus}
        </span>

        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-bold text-violet-300">
          {engineVersion}
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
        model={engineVersion}
      />
    </section>
  );
}
