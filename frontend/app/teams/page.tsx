import Link from "next/link";

import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections } from "@/lib/i18n/config";

type TeamItem = {
  id: number;
  sportmonks_id?: number | null;
  name: string;
  country?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
};

const TEAMS_PAGE_TEXT = {
  ar: {
    eyebrow: "مركز الفرق",
    title: "الفرق",
    description:
      "استعرض جميع الفرق وافتح صفحة كل فريق لمراجعة بياناته وتحليلاته.",
    teamCount: (count: number) =>
      `${count} فريق`,
    loadError: "تعذر تحميل الفرق.",
    noTeams: "لا توجد فرق متاحة حاليًا.",
    openTeam: "فتح صفحة الفريق",
    logoOf: "شعار",
  },

  sv: {
    eyebrow: "LAGCENTER",
    title: "Lag",
    description:
      "Utforska alla lag och öppna lagsidan för att granska data och analyser.",
    teamCount: (count: number) =>
      `${count} ${count === 1 ? "lag" : "lag"}`,
    loadError: "Det gick inte att ladda lagen.",
    noTeams: "Det finns inga lag tillgängliga just nu.",
    openTeam: "Öppna lagsidan",
    logoOf: "Logotyp för",
  },

  en: {
    eyebrow: "TEAMS CENTER",
    title: "Teams",
    description:
      "Browse all teams and open each team page to review its data and analysis.",
    teamCount: (count: number) =>
      `${count} ${count === 1 ? "team" : "teams"}`,
    loadError: "Failed to load teams.",
    noTeams: "No teams are currently available.",
    openTeam: "Open Team Page",
    logoOf: "Logo of",
  },
} as const;

async function getTeams(): Promise<TeamItem[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://backend:8000";

  const response = await fetch(
    `${apiUrl}/teams`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load teams.");
  }

  return response.json();
}

function getTeamLogo(team: TeamItem): string | null {
  return team.logo_url ?? team.image_path ?? null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = TEAMS_PAGE_TEXT[locale];

  let teams: TeamItem[] = [];
  let errorMessage: string | null = null;

  try {
    teams = await getTeams();
  } catch {
    errorMessage = text.loadError;
  }

  return (
    <main
      dir={direction}
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
            {text.eyebrow}
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                {text.title}
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                {text.description}
              </p>
            </div>

            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
              {text.teamCount(teams.length)}
            </span>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-red-200">
            {errorMessage}
          </section>
        ) : null}

        {!errorMessage &&
        teams.length === 0 ? (
          <section className="rounded-3xl border border-amber-500/30 bg-amber-950/10 p-6 text-amber-200">
            {text.noTeams}
          </section>
        ) : null}

        {teams.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => {
              const logo =
                getTeamLogo(team);

              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group rounded-[28px] border border-slate-800 bg-[#050b1e] p-6 transition hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="flex items-center gap-5">
                    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logo}
                          alt={`${text.logoOf} ${team.name}`}
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <span className="text-xl font-black text-cyan-300">
                          {getInitials(
                            team.name,
                          )}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-xl font-black leading-snug text-white transition group-hover:text-cyan-300">
                        {team.name}
                      </h2>

                      {team.country &&
                      team.country.toLowerCase() !==
                        "unknown" ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {team.country}
                        </p>
                      ) : null}

                      <p className="mt-3 text-sm font-bold text-cyan-400">
                        {text.openTeam} →
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
