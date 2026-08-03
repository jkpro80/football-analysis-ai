import Link from "next/link";

type TeamItem = {
  id: number;
  sportmonks_id?: number | null;
  name: string;
  country?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
};

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
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  let teams: TeamItem[] = [];
  let errorMessage: string | null = null;

  try {
    teams = await getTeams();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "تعذر تحميل الفرق.";
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
            Teams Center
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                الفرق
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                استعرض جميع الفرق وافتح صفحة كل فريق لمراجعة بياناته وتحليلاته.
              </p>
            </div>

            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
              {teams.length} فريق
            </span>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-red-200">
            {errorMessage}
          </section>
        ) : null}

        {!errorMessage && teams.length === 0 ? (
          <section className="rounded-3xl border border-amber-500/30 bg-amber-950/10 p-6 text-amber-200">
            لا توجد فرق متاحة حاليًا.
          </section>
        ) : null}

        {teams.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => {
              const logo = getTeamLogo(team);

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
                          alt={`شعار ${team.name}`}
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <span className="text-xl font-black text-cyan-300">
                          {getInitials(team.name)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-xl font-black leading-snug text-white transition group-hover:text-cyan-300">
                        {team.name}
                      </h2>

                      {team.country &&
                      team.country.toLowerCase() !== "unknown" ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {team.country}
                        </p>
                      ) : null}

                      <p className="mt-3 text-sm font-bold text-cyan-400">
                        فتح صفحة الفريق ←
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

