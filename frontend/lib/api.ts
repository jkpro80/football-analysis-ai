type ApiRequestOptions = RequestInit & {
  admin?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(
    message: string,
    status: number,
    detail: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

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

  if (
    typeof window !== "undefined" &&
    !headers.has("Authorization")
  ) {
    const accessToken = window.localStorage.getItem(
      "football_ai_access_token",
    );

    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );
    }
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
    let message =
      `API request failed with status ${response.status}.`;

    let detail: unknown = null;

    try {
      const body = await response.json();

      detail = body?.detail ?? null;

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
        message =
          "لقد استهلكت الحد الشهري لتحليلات حسابك. يرجى ترقية الاشتراك.";
        break;

      case "Pro subscription required.":
      case "The pro plan or higher is required for this feature.":
        message =
          "هذه الميزة متاحة لمشتركي Pro أو أعلى.";
        break;

      case "Premium subscription required.":
      case "The premium plan or higher is required for this feature.":
        message =
          "هذه الميزة متاحة لمشتركي Premium فقط.";
        break;
    }

    throw new ApiError(
      message,
      response.status,
      detail,
    );
  }

  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return undefined as T;
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
