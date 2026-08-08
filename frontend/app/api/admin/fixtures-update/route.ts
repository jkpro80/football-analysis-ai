import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  teamIds?: number[];
  startDate?: string;
  endDate?: string;
};

async function readResponse(
  response: Response,
) {
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
          "ADMIN_API_KEY is not configured.",
      },
      {
        status: 500,
      },
    );
  }

  let body: RequestBody;

  try {
    body =
      (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      {
        detail: "Invalid JSON body.",
      },
      {
        status: 400,
      },
    );
  }

  const teamIds = Array.from(
    new Set(
      (body.teamIds ?? [])
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0,
        ),
    ),
  );

  const startDate =
    String(body.startDate ?? "").trim();

  const endDate =
    String(body.endDate ?? "").trim();

  if (
    teamIds.length === 0 ||
    !startDate ||
    !endDate
  ) {
    return NextResponse.json(
      {
        detail:
          "teamIds, startDate and endDate are required.",
      },
      {
        status: 422,
      },
    );
  }

  let succeeded = 0;
  let failed = 0;

  const results = [];

  for (const teamId of teamIds) {
    try {
      const query = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      const response = await fetch(
        `${backendUrl}/sync/team/${teamId}?${query}`,
        {
          method: "POST",
          headers: {
            "X-Admin-Key": adminKey,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(35000),
        },
      );

      const data =
        await readResponse(response);

      if (response.ok) {
        succeeded += 1;
      } else {
        failed += 1;
      }

      results.push({
        teamId,
        ok: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      failed += 1;

      results.push({
        teamId,
        ok: false,
        status: 502,
        data: {
          detail:
            error instanceof Error
              ? error.message
              : "Unknown error.",
        },
      });
    }
  }

  return NextResponse.json({
    processed: teamIds.length,
    succeeded,
    failed,
    results,
  });
}
