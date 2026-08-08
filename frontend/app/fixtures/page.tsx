import Link from "next/link";

import FixturesHeader from "@/components/fixtures/FixturesHeader";
import FixturesList from "@/components/fixtures/FixturesList";

type MatchItem = {
  id: number;
  sportmonks_id: number | null;
  home_team_id: number;
  away_team_id: number;
  home_team: string;
  away_team: string;

  home_logo?: string | null;
  away_logo?: string | null;

  league_name?: string | null;
  league_logo?: string | null;

  date: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
};

type PredictionItem = {
  match: {
    id: number;
    home_team?: string;
    away_team?: string;
    date?: string;
    status?: string;
  };

  predicted_score: string;

  best_pick: {
    key: string;
    label: string;
    probability: number;
  };

  confidence: {
    label: string;
    score: number;
  };

  expected_goals: {
    home: number;
    away: number;
    total: number;
  };

  prediction_record_id?: number;

  fixture?: {
    id: number;
    sportmonks_id?: number;
    date?: string;
    status?: string;
  };
};
async function getMatches(): Promise<MatchItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const response = await fetch(
    `${apiUrl}/matches?limit=100`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load matches.");
  }

  return response.json();
}

async function getPredictions(): Promise<PredictionItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const response = await fetch(
    `${apiUrl}/predictions/latest/upcoming?limit=100`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as
    | PredictionItem[]
    | {
        predictions?: PredictionItem[];
      };

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.predictions)
    ? data.predictions
    : [];
}
function formatMatchDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "تاريخ غير متوفر",
      time: "--:--",
    };
  }

  return {
    date: new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date),

    time: new Intl.DateTimeFormat("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function getStatusLabel(status: string | null) {
  const normalizedStatus =
    status?.toLowerCase() ?? "";

  if (
    normalizedStatus.includes("live") ||
    normalizedStatus.includes("inplay")
  ) {
    return {
      label: "مباشر",
      className:
        "border-red-500/20 bg-red-500/10 text-red-300",
    };
  }

  if (
    normalizedStatus.includes("finished") ||
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("ended")
  ) {
    return {
      label: "منتهية",
      className:
        "border-slate-600 bg-slate-800 text-slate-300",
    };
  }

  if (
    normalizedStatus.includes("postponed") ||
    normalizedStatus.includes("cancelled")
  ) {
    return {
      label: "مؤجلة",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: "قادمة",
    className:
      "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  };
}

export default async function FixturesPage() {
  let matches: MatchItem[] = [];
  let predictions: PredictionItem[] = [];
  let errorMessage = "";

  try {
    [matches, predictions] = await Promise.all([
      getMatches(),
      getPredictions(),
    ]);
  } catch {
    errorMessage =
      "تعذر تحميل المباريات من الخادم.";
  }

  const predictionsByMatchId = new Map<number, PredictionItem>(
    predictions.map((prediction) => [
      prediction.match.id,
      prediction,
    ]),
  );

  return (

      <main
        dir="rtl"
        className="min-h-screen text-slate-100"
      >
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <FixturesHeader matches={matches} />

            <FixturesList
              matches={matches}
              predictions={predictions}
            />
          </div>
        </div>
      </main>

  );
}


