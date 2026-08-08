import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateRequest = {
  action?: "sync" | "finalize";
  teamIds?: number[];
  startDate?: string;
  endDate?: string;
};

type BackendResult = {
  ok: boolean;
  teamId?: number;
  status: number;
  data: unknown;
};

function normalizeTeamIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item > 0,
        ),
    ),
  );
}

async function readResponse(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {
    detail: await response.text(),
  };
}

export async function POST(
  request: NextRequest,
) {
  const backendUrl = (
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000"
  ).replace(/\/+$/, "");

  const adminKey =
    process.env.ADMIN_API_KEY?.trim();

  if (!adminKey) {
    return NextResponse.json(
      {
        detail:
          "ADMIN_API_KEY is not configured in frontend.",
      },
      {
        status: 500,
      },
    );
  }

  let body: UpdateRequest;

  try {
    body = (await request.json()) as UpdateRequest;
  } catch {
    return NextResponse.json(
      {
        detail: "Invalid JSON request body.",
      },
      {
        status: 400,
      },
    );
  }

  const action = body.action ?? "sync";
  const teamIds = normalizeTeamIds(body.teamIds);
  const startDate = String(
    body.startDate ?? "",
  ).trim();
  const endDate = String(
    body.endDate ?? "",
  ).trim();

  if (teamIds.length === 0) {
    return NextResponse.json(
      {
        detail:
          "At least one SportMonks team ID is required.",
      },
      {
        status: 422,
      },
    );
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        detail:
          "startDate and endDate are required.",
      },
      {
        status: 422,
      },
    );
  }

  const headers = {
    "X-Admin-Key": adminKey,
    Accept: "application/json",
  };

  try {
    if (action === "finalize") {
      const parameters = new URLSearchParams({
        team_ids: String(teamIds[0]),
        start_date: startDate,
        end_date: endDate,
        statistics_limit: "5",
        elo_limit: "100",
        prediction_limit: "100",
        recent_limit: "5",
        replace_existing_predictions: "false",
      });

      const response = await fetch(
        `${backendUrl}/system/update-all?${parameters}`,
        {
          method: "POST",
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(55000),
        },
      );

      const data = await readResponse(response);

      return NextResponse.json(
        {
          ok: response.ok,
          action,
          data,
        },
        {
          status: response.ok
            ? 200
            : response.status,
        },
      );
    }

    const results: BackendResult[] = [];

    /*
     * The browser sends only a small batch per request.
     * We synchronize teams sequentially to avoid
     * SportMonks rate spikes and Nginx timeouts.
     */
    for (const teamId of teamIds) {
      const parameters = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const response = await fetch(
        `${backendUrl}/sync/team/${teamId}?${parameters}`,
        {
          method: "POST",
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        },
      );

      results.push({
        ok: response.ok,
        teamId,
        status: response.status,
        data: await readResponse(response),
      });
    }

    const failed = results.filter(
      (result) => !result.ok,
    );

    return NextResponse.json(
      {
        ok: failed.length === 0,
        action,
        processed: results.length,
        succeeded:
          results.length - failed.length,
        failed: failed.length,
        results,
      },
      {
        /*
         * Return 200 for completed batches even if an
         * individual team failed. The client can continue
         * processing later batches and report the failures.
         */
        status: 200,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown update error.";

    return NextResponse.json(
      {
        detail: message,
      },
      {
        status: 502,
      },
    );
  }
}

