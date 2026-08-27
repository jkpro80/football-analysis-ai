import { apiFetch } from "@/lib/api";

export interface StrongPick {
  match_id: number | null;
  fixture_id: number | null;
  sportmonks_id: number | null;
  date: string | null;
  home_team: string | null;
  away_team: string | null;
  league: string | null;

  market:
    | "match_result"
    | "double_chance"
    | "draw_no_bet"
    | "btts"
    | `total_${string}`;

  selection: string;

  probability: number;

  confidence:
    | number
    | string
    | Record<string, unknown>
    | null;

  confidence_score: number | null;
  ranking_score: number;
}

export interface StrongPicksResponse {
  success: boolean;
  feature: "premium_strong_picks";
  requested_count: number;
  selected_count: number;
  complete: boolean;
  min_probability: number;
  min_confidence: number;
  average_probability: number | null;
  picks: StrongPick[];
  message: string;
}

export async function getStrongPicks(
  count: number,
): Promise<StrongPicksResponse> {
  if (!Number.isInteger(count) || count < 2 || count > 10) {
    throw new Error(
      "Strong Picks count must be between 2 and 10.",
    );
  }

  return apiFetch<StrongPicksResponse>(
    `/strong-picks?count=${count}`,
  );
}
