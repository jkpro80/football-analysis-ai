import { apiFetch } from "@/lib/api";
import type { PredictionResponse } from "@/types/prediction";

export async function getPrediction(
  matchId: number,
): Promise<PredictionResponse> {
  if (!Number.isInteger(matchId) || matchId <= 0) {
    throw new Error("رقم المباراة غير صالح.");
  }

  try {
    return await apiFetch<PredictionResponse>(
      `/predictions/${matchId}`,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `تعذر تحميل توقع المباراة رقم ${matchId}`;

    throw new Error(message);
  }
}
