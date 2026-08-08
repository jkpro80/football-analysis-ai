type ApiRequestOptions = RequestInit & {
  admin?: boolean;
};

const SERVER_API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_API_URL ??
  "http://backend:8000";

const BROWSER_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";

function getApiUrl(): string {
  return typeof window === "undefined"
    ? SERVER_API_URL
    : BROWSER_API_URL;
}

function buildHeaders(
  options: ApiRequestOptions,
): HeadersInit {
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (options.admin && typeof window === "undefined") {
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiKey) {
      throw new Error(
        "ADMIN_API_KEY is not configured in the frontend container.",
      );
    }

    headers.set("X-Admin-Key", adminApiKey);
  }

  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const response = await fetch(
    `${getApiUrl()}${normalizedPath}`,
    {
      ...options,
      cache: options.cache ?? "no-store",
      headers: buildHeaders(options),
    },
  );

  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (
        body?.detail &&
        typeof body.detail.message === "string"
      ) {
        message = body.detail.message;
      }
    } catch {
      // Keep the generic HTTP status message.
    }
    switch (message) {
      case "Monthly analysis limit reached.":
        throw new Error(
          "لقد استهلكت الحد الشهري لتحليلات حسابك. يرجى ترقية الاشتراك.",
        );
      case "Pro subscription required.":
        throw new Error(
          "هذه الميزة متاحة لمشتركي Pro أو أعلى.",
        );
      case "Premium subscription required.":
        throw new Error(
          "هذه الميزة متاحة لمشتركي Premium فقط.",
        );
      default:
        throw new Error(message);
    }
  }

  return (await response.json()) as T;
}

export async function getPrediction(
  matchId: number,
): Promise<unknown> {
  if (!Number.isInteger(matchId) || matchId <= 0) {
    throw new Error("Invalid match ID.");
  }

  return apiFetch<unknown>(
    `/predictions/${matchId}`,
  );
}

