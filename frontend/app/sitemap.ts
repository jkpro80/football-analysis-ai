import type { MetadataRoute } from "next";

const BASE_URL = "https://målx.com";

const SERVER_API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_API_URL ??
  "http://backend:8000";

const MATCH_PAGE_SIZE = 500;
const MAX_MATCH_PAGES = 20;

type SitemapMatch = {
  id: number;
  date?: string | null;
  status?: string | null;
  home_team?: string | null;
  away_team?: string | null;
};

type SitemapTeam = {
  id: number;
  name?: string | null;
};

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/fixtures", changeFrequency: "hourly", priority: 0.9 },
  { path: "/live", changeFrequency: "hourly", priority: 0.8 },
  { path: "/predictions", changeFrequency: "daily", priority: 0.9 },
  { path: "/leagues", changeFrequency: "daily", priority: 0.8 },
  { path: "/teams", changeFrequency: "daily", priority: 0.8 },
  { path: "/statistics", changeFrequency: "daily", priority: 0.7 },
  { path: "/value-bets", changeFrequency: "daily", priority: 0.7 },
  { path: "/subscription", changeFrequency: "weekly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.3 },
  {
    path: "/subscription-terms",
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

function isValidSitemapMatch(
  match: SitemapMatch,
): boolean {
  return (
    Number.isInteger(match.id) &&
    match.id > 0 &&
    typeof match.home_team === "string" &&
    match.home_team.trim().length > 0 &&
    typeof match.away_team === "string" &&
    match.away_team.trim().length > 0 &&
    typeof match.date === "string" &&
    !Number.isNaN(Date.parse(match.date))
  );
}

async function getPublicMatchesForSitemap(): Promise<SitemapMatch[]> {
  const matches: SitemapMatch[] = [];

  for (let page = 0; page < MAX_MATCH_PAGES; page += 1) {
    const offset = page * MATCH_PAGE_SIZE;

    try {
      const response = await fetch(
        `${SERVER_API_URL}/matches?limit=${MATCH_PAGE_SIZE}&offset=${offset}`,
        {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        console.error(
          `Sitemap match fetch failed at offset ${offset}: ${response.status}`,
        );
        break;
      }

      const batch = (await response.json()) as SitemapMatch[];

      if (!Array.isArray(batch) || batch.length === 0) {
        break;
      }

      matches.push(...batch);

      if (batch.length < MATCH_PAGE_SIZE) {
        break;
      }
    } catch (error) {
      console.error(
        `Sitemap match fetch failed at offset ${offset}.`,
        error,
      );
      break;
    }
  }

  const uniqueMatches = new Map<number, SitemapMatch>();

  for (const match of matches) {
    if (isValidSitemapMatch(match)) {
      uniqueMatches.set(match.id, match);
    }
  }

  return Array.from(uniqueMatches.values());
}

function isValidSitemapTeam(team: SitemapTeam): boolean {
  return (
    Number.isInteger(team.id) &&
    team.id > 0 &&
    typeof team.name === "string" &&
    team.name.trim().length > 0
  );
}

async function getPublicTeamsForSitemap(): Promise<SitemapTeam[]> {
  try {
    const response = await fetch(
      `${SERVER_API_URL}/teams?limit=1000`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        `Sitemap team fetch failed: ${response.status}`,
      );
      return [];
    }

    const teams = (await response.json()) as SitemapTeam[];

    if (!Array.isArray(teams)) {
      return [];
    }

    const uniqueTeams = new Map<number, SitemapTeam>();

    for (const team of teams) {
      if (isValidSitemapTeam(team)) {
        uniqueTeams.set(team.id, team);
      }
    }

    return Array.from(uniqueTeams.values());
  } catch (error) {
    console.error(
      "Sitemap team fetch failed.",
      error,
    );
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${BASE_URL}${path}`,
      changeFrequency,
      priority,
    }),
  );

  const [matches, teams] = await Promise.all([
    getPublicMatchesForSitemap(),
    getPublicTeamsForSitemap(),
  ]);

  const matchEntries: MetadataRoute.Sitemap = matches.map((match) => {
    const status = match.status?.trim().toLowerCase() ?? "";

    const isScheduled = [
      "1",
      "2",
      "ns",
      "scheduled",
      "not_started",
      "pending",
    ].includes(status);

    return {
      url: `${BASE_URL}/matches/${match.id}`,
      changeFrequency: isScheduled ? "daily" : "weekly",
      priority: isScheduled ? 0.8 : 0.6,
    };
  });

  const teamEntries: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${BASE_URL}/teams/${team.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...matchEntries,
    ...teamEntries,
  ];
}
