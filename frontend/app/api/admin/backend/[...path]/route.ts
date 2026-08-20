import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const backendUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    return NextResponse.json(
      {
        detail:
          "ADMIN_API_KEY is not configured in Next.js.",
      },
      { status: 500 },
    );
  }

  const { path } = await context.params;

  const backendPath = path.join("/");
  const search = request.nextUrl.search;

  const targetUrl =
    `${backendUrl}/${backendPath}${search}`;

  const headers = new Headers();

  headers.set("Accept", "application/json");
  headers.set("X-Admin-Key", adminApiKey);

  const incomingContentType =
    request.headers.get("content-type");

  if (incomingContentType) {
    headers.set("Content-Type", incomingContentType);
  }

  const hasBody =
    request.method !== "GET" &&
    request.method !== "HEAD";

  const body = hasBody
    ? await request.text()
    : undefined;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body || undefined,
      cache: "no-store",
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ??
          "application/json",
      },
    });
  } catch (error) {
    console.error("Backend proxy error:", error);

    return NextResponse.json(
      {
        detail:
          "Could not connect to the backend server.",
      },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}