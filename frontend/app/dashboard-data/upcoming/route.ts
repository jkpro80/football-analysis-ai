import { NextRequest, NextResponse } from "next/server";

import { getUpcomingDashboardBatch } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 50;

export async function GET(
  request: NextRequest,
) {
  const rawOffset =
    request.nextUrl.searchParams.get("offset");

  const parsedOffset = Number.parseInt(
    rawOffset ?? "0",
    10,
  );

  const offset =
    Number.isFinite(parsedOffset) &&
    parsedOffset >= 0
      ? parsedOffset
      : 0;

  try {
    const batch =
      await getUpcomingDashboardBatch(
        offset,
        BATCH_SIZE,
      );

    return NextResponse.json(
      {
        fixtures: batch.fixtures,
        count: batch.count,
        failedCount: batch.failedCount,
        offset,
        limit: BATCH_SIZE,
        hasMore: batch.hasMore,
        nextOffset: batch.nextOffset,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Failed to load more dashboard fixtures:",
      error,
    );

    return NextResponse.json(
      {
        detail:
          "Failed to load additional matches.",
      },
      {
        status: 502,
      },
    );
  }
}
