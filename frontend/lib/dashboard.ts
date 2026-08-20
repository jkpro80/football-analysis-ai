import type { DashboardFixture } from "@/components/home/HomeDashboard";
import { normalizeStatus } from "@/components/home/helpers";
import { apiFetch } from "@/lib/api";

type ApiTeam = {
  id: number;
  name: string;
  country?: string;
  logo_url?: string | null;
};

type ApiPrediction = {
  prediction_record_id: number;

  fixture: {
    id: number;
    sportmonks_id?: number;
    date?: string;
    status?: string;
  };

  teams: {
    home: ApiTeam;
    away: ApiTeam;
  };

  expected_goals?: {
    home: number;
    away: number;
    total: number;
  };

  probabilities?: {
    home_win: number;
    draw: number;
    away_win: number;
    over_2_5: number;
    under_2_5: number;
    btts: number;
    no_btts: number;
  };

  predicted_score?: string;

  best_pick?: {
    key: string;
    label: string;
    probability: number;
  };

  confidence?: {
    label: string;
    score: number;
  };

  model_version?: string;
};

type PredictionsApiResponse = {
  status: string;
  model_version?: string;
  count: number;
  predictions: ApiPrediction[];
};

function normalizeOptionalText(
  value?: string | null,
): string | undefined {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return undefined;
  }

  const lower = normalized.toLowerCase();

  if (
    lower === "unknown" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "null" ||
    lower === "undefined"
  ) {
    return undefined;
  }

  return normalized;
}

function mapPrediction(
  item: ApiPrediction,
  fallbackModelVersion?: string,
): DashboardFixture {
  return {
    id: Number(item.fixture.id),

    predictionRecordId:
      item.prediction_record_id,

    date:
      item.fixture.date,

    status:
      normalizeStatus(
        item.fixture.status ?? "scheduled",
      ),

    homeTeam: {
      id:
        item.teams.home.id,

      name:
        item.teams.home.name ??
        "الفريق المضيف",

      country:
        normalizeOptionalText(
          item.teams.home.country,
        ),

      logo:
        item.teams.home.logo_url,
    },

    awayTeam: {
      id:
        item.teams.away.id,

      name:
        item.teams.away.name ??
        "الفريق الضيف",

      country:
        normalizeOptionalText(
          item.teams.away.country,
        ),

      logo:
        item.teams.away.logo_url,
    },

    predictedScore:
      item.predicted_score,

    expectedGoals:
      item.expected_goals,

    probabilities:
      item.probabilities
        ? {
            homeWin:
              item.probabilities.home_win,

            draw:
              item.probabilities.draw,

            awayWin:
              item.probabilities.away_win,

            over25:
              item.probabilities.over_2_5,

            under25:
              item.probabilities.under_2_5,

            btts:
              item.probabilities.btts,

            noBtts:
              item.probabilities.no_btts,
          }
        : undefined,

    bestPick:
      item.best_pick
        ? {
            key:
              item.best_pick.key,

            label:
              item.best_pick.label,

            probability:
              Number(
                item.best_pick.probability,
              ),
          }
        : undefined,

    confidence:
      item.confidence
        ? {
            label:
              item.confidence.label,

            score:
              Number(
                item.confidence.score,
              ),
          }
        : undefined,

    modelVersion:
      item.model_version ??
      fallbackModelVersion,
  };
}

function mapPredictions(
  data: PredictionsApiResponse,
): DashboardFixture[] {
  const predictions = Array.isArray(
    data.predictions,
  )
    ? data.predictions
    : [];

  return predictions
    .filter((item) => {
      return (
        item !== undefined &&
        item.fixture !== undefined &&
        Number(item.fixture.id) > 0 &&
        item.teams !== undefined &&
        item.teams.home !== undefined &&
        item.teams.away !== undefined
      );
    })
    .map((item) =>
      mapPrediction(
        item,
        data.model_version,
      ),
    );
}

export async function getDashboardData(): Promise<{
  fixtures: DashboardFixture[];
  explorerFixtures: DashboardFixture[];
  modelVersion: string;
}> {
  try {
    const [
      upcomingData,
      finishedData,
    ] = await Promise.all([
      apiFetch<PredictionsApiResponse>(
        "/predictions/latest/upcoming",
        {
          method: "GET",
          admin: true,
        },
      ),

      apiFetch<PredictionsApiResponse>(
        "/predictions/latest/finished?limit=100",
        {
          method: "GET",
          admin: true,
        },
      ),
    ]);

    const fixtures =
      mapPredictions(upcomingData);

    const finishedFixtures =
      mapPredictions(finishedData);

    const fixtureMap =
      new Map<number, DashboardFixture>();

    for (const fixture of [
      ...fixtures,
      ...finishedFixtures,
    ]) {
      fixtureMap.set(
        fixture.id,
        fixture,
      );
    }

    const explorerFixtures = Array.from(
      fixtureMap.values(),
    );

    return {
      fixtures,
      explorerFixtures,
      modelVersion:
        fixtures[0]?.modelVersion ??
        upcomingData.model_version ??
        finishedData.model_version ??
        "Prediction Engine V11",
    };
  } catch (error) {
    console.error(
      "Failed to load dashboard data:",
      error,
    );

    return {
      fixtures: [],
      explorerFixtures: [],
      modelVersion: "Prediction Engine V11",
    };
  }
}
