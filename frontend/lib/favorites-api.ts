export type FavoriteTeam = {
  id: number;
  name: string;
  country: string | null;
  logo_url: string | null;
};

export type FavoriteExpectedGoals = {
  home: number;
  away: number;
  total: number;
};

export type FavoriteProbabilities = {
  home_win: number;
  draw: number;
  away_win: number;
  over_2_5: number;
  under_2_5: number;
  btts: number;
  no_btts: number;
};

export type FavoriteBestPick = {
  key: string;
  label: string;
  probability: number;
};

export type FavoriteConfidence = {
  label: string;
  score: number;
};

export type FavoriteLatestPrediction = {
  prediction_record_id: number;

  expected_goals: FavoriteExpectedGoals;

  probabilities: FavoriteProbabilities;

  predicted_score: string | null;

  best_pick: FavoriteBestPick | null;

  confidence: FavoriteConfidence;

  model_version: string;
};

export type FavoriteMatchDetails = {
  id: number;
  sportmonks_id: number | null;
  date: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  league_name: string | null;
  league_logo: string | null;
  venue_name: string | null;

  home_team: FavoriteTeam;
  away_team: FavoriteTeam;

  latest_prediction: FavoriteLatestPrediction | null;
};

export type FavoriteItem = {
  id: number;
  match_id: number;
  created_at: string;
  match?: FavoriteMatchDetails;
};

export type FavoriteStatus = {
  match_id: number;
  is_favorite: boolean;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

async function favoriteRequest<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options?.headers || {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Favorites API request failed: ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getFavorites(
  accessToken: string,
): Promise<FavoriteItem[]> {
  return favoriteRequest<FavoriteItem[]>(
    "/favorites",
    accessToken,
  );
}

export function getFavoriteStatus(
  accessToken: string,
  matchId: number,
): Promise<FavoriteStatus> {
  return favoriteRequest<FavoriteStatus>(
    `/favorites/${matchId}/status`,
    accessToken,
  );
}

export function addFavorite(
  accessToken: string,
  matchId: number,
): Promise<FavoriteItem> {
  return favoriteRequest<FavoriteItem>(
    `/favorites/${matchId}`,
    accessToken,
    {
      method: "POST",
    },
  );
}

export function removeFavorite(
  accessToken: string,
  matchId: number,
): Promise<void> {
  return favoriteRequest<void>(
    `/favorites/${matchId}`,
    accessToken,
    {
      method: "DELETE",
    },
  );
}