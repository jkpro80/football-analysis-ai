import { apiFetch } from "@/lib/api";

export type PredictionCardItem = {
  id: number;
  match_id: number;
  prediction_record_id: number | null;
  home_team: string | null;
  away_team: string | null;
  match_status: string | null;
  match_date: string | null;
  market: string;
  selection: string;
  line: number | null;
  expected_value: number | null;
  probability: number;
  confidence: number | null;
  model_version: string | null;
  decimal_odds: number | null;
  bookmaker_name: string | null;
  provider_odd_id: number | null;
  home_score: number | null;
  away_score: number | null;
  actual_result: string | null;
  actual_value: number | null;
  evaluation_status: "pending" | "won" | "lost";
  is_correct: boolean | null;
  created_at: string | null;
};

export type PredictionCard = {
  id: number;
  card_number: string;
  title: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  items_count: number;
  resolved_count: number;
  won_count: number;
  lost_count: number;
  items: PredictionCardItem[];
};

export type CreatePredictionCardPayload = {
  title?: string | null;
};

export type PredictionCardGenerateMode =
  | "automatic"
  | "today"
  | "single"
  | "accumulator";

export type GeneratePredictionCardPayload = {
  mode?: PredictionCardGenerateMode;
  count: number;
  match_id?: number | null;
  timezone_offset_minutes?: number;
  title?: string | null;
};

export type AddPredictionCardItemPayload = {
  match_id: number;
  market: string;
  selection: string;
  line?: number | null;
};

function assertPositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

export function createPredictionCard(
  payload: CreatePredictionCardPayload = {},
): Promise<PredictionCard> {
  return apiFetch<PredictionCard>(
    "/prediction-cards",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function generatePredictionCard(
  payload: GeneratePredictionCardPayload,
): Promise<PredictionCard> {
  if (
    !Number.isInteger(payload.count) ||
    payload.count < 1 ||
    payload.count > 15
  ) {
    throw new Error(
      "count must be an integer between 1 and 15.",
    );
  }

  if (
    payload.mode === "single" &&
    (
      payload.match_id == null ||
      !Number.isInteger(payload.match_id) ||
      payload.match_id <= 0
    )
  ) {
    throw new Error(
      "match_id is required for single match mode.",
    );
  }

  if (
    payload.timezone_offset_minutes != null &&
    (
      !Number.isInteger(payload.timezone_offset_minutes) ||
      payload.timezone_offset_minutes < -840 ||
      payload.timezone_offset_minutes > 840
    )
  ) {
    throw new Error(
      "timezone_offset_minutes must be between -840 and 840.",
    );
  }

  return apiFetch<PredictionCard>(
    "/prediction-cards/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getPredictionCards(): Promise<
  PredictionCard[]
> {
  return apiFetch<PredictionCard[]>(
    "/prediction-cards",
  );
}

export function getPredictionCard(
  cardId: number,
): Promise<PredictionCard> {
  assertPositiveInteger(cardId, "cardId");

  return apiFetch<PredictionCard>(
    `/prediction-cards/${cardId}`,
  );
}

export function deletePredictionCard(
  cardId: number,
): Promise<void> {
  assertPositiveInteger(cardId, "cardId");

  return apiFetch<void>(
    `/prediction-cards/${cardId}`,
    {
      method: "DELETE",
    },
  );
}

export function addPredictionCardItem(
  cardId: number,
  payload: AddPredictionCardItemPayload,
): Promise<PredictionCardItem> {
  assertPositiveInteger(cardId, "cardId");
  assertPositiveInteger(payload.match_id, "match_id");

  if (!payload.market.trim()) {
    throw new Error("market is required.");
  }

  if (!payload.selection.trim()) {
    throw new Error("selection is required.");
  }

  return apiFetch<PredictionCardItem>(
    `/prediction-cards/${cardId}/items`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function removePredictionCardItem(
  cardId: number,
  itemId: number,
): Promise<void> {
  assertPositiveInteger(cardId, "cardId");
  assertPositiveInteger(itemId, "itemId");

  return apiFetch<void>(
    `/prediction-cards/${cardId}/items/${itemId}`,
    {
      method: "DELETE",
    },
  );
}
