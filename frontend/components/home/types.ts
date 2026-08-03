export type DashboardTeam = {
  id?: number;
  name: string;
  country?: string;
  logo?: string | null;
};

export type DashboardFixture = {
  id: number;
  predictionRecordId?: number;
  date?: string;
  status?: string;

  homeTeam: DashboardTeam;
  awayTeam: DashboardTeam;

  predictedScore?: string;

  expectedGoals?: {
    home: number;
    away: number;
    total: number;
  };

  probabilities?: {
    homeWin: number;
    draw: number;
    awayWin: number;
    over25: number;
    under25: number;
    btts: number;
    noBtts: number;
  };

  bestPick?: {
    key: string;
    label: string;
    probability: number;
  };

  confidence?: {
    label: string;
    score: number;
  };

  modelVersion?: string;
};

export type HomeDashboardProps = {
  fixtures: DashboardFixture[];
  modelVersion: string;
};

export type StatusFilter =
  | "all"
  | "scheduled"
  | "live"
  | "finished";

export type SortOption =
  | "confidence"
  | "best-pick"
  | "date";

export type QuickFilter =
  | "all"
  | "today"
  | "tomorrow"
  | "week"
  | "high-confidence"
  | "over25"
  | "btts"
  | "home-win"
  | "away-win";
