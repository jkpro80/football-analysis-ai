import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections } from "@/lib/i18n/config";

type Team = {
  id: number;
  sportmonks_id: number | null;
  name: string;
  country: string | null;
  attack: number;
  defense: number;
  midfield: number;
  elo: number;
  home_advantage: number;
  goals_scored?: number;
  goals_conceded?: number;
};

type Match = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_team: string;
  away_team: string;
  date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  league_name: string | null;
};

type TeamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const TEAM_PAGE_TEXT = {
  ar: {
    backToTeams: "العودة إلى الفرق",
    dashboard: "لوحة التحكم",
    profile: "ملف الفريق",
    unknownCountry: "الدولة غير محددة",
    connectedSportmonks: "مرتبط بـ Sportmonks",
    manualTeam: "فريق مضاف يدويًا",

    attack: "الهجوم",
    defense: "الدفاع",
    midfield: "الوسط",
    overallRating: "التقييم العام",
    elo: "ELO",
    homeAdvantage: "أفضلية الأرض",

    attackingStrength: "القوة الهجومية",
    defensiveStrength: "القوة الدفاعية",
    midfieldStrength: "قوة خط الوسط",

    recentMatches: "آخر المباريات",
    noMatches: "لا توجد مباريات متاحة لهذا الفريق حاليًا.",

    teamMatchesError: "تعذر تحميل مباريات الفريق.",
    teamDataError: "تعذر تحميل بيانات الفريق.",
  },

  sv: {
    backToTeams: "Tillbaka till lagen",
    dashboard: "Kontrollpanel",
    profile: "LAGPROFIL",
    unknownCountry: "Land ej angivet",
    connectedSportmonks: "Ansluten till Sportmonks",
    manualTeam: "Manuellt tillagt lag",

    attack: "Anfall",
    defense: "Försvar",
    midfield: "Mittfält",
    overallRating: "Totalbetyg",
    elo: "ELO",
    homeAdvantage: "Hemmafördel",

    attackingStrength: "Anfallsstyrka",
    defensiveStrength: "Försvarsstyrka",
    midfieldStrength: "Mittfältsstyrka",

    recentMatches: "Senaste matcher",
    noMatches: "Det finns inga matcher tillgängliga för detta lag just nu.",

    teamMatchesError: "Det gick inte att ladda lagets matcher.",
    teamDataError: "Det gick inte att ladda lagets data.",
  },

  en: {
    backToTeams: "Back to Teams",
    dashboard: "Dashboard",
    profile: "TEAM PROFILE",
    unknownCountry: "Country not specified",
    connectedSportmonks: "Connected to Sportmonks",
    manualTeam: "Manually added team",

    attack: "Attack",
    defense: "Defense",
    midfield: "Midfield",
    overallRating: "Overall Rating",
    elo: "ELO",
    homeAdvantage: "Home Advantage",

    attackingStrength: "Attacking Strength",
    defensiveStrength: "Defensive Strength",
    midfieldStrength: "Midfield Strength",

    recentMatches: "Recent Matches",
    noMatches: "No matches are currently available for this team.",

    teamMatchesError: "Failed to load team matches.",
    teamDataError: "Failed to load team data.",
  },
} as const;

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_API_URL ??
  "http://backend:8000";

export const dynamic = "force-dynamic";

export default async function TeamDetailsPage({
  params,
}: TeamPageProps) {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = TEAM_PAGE_TEXT[locale];

  const { id } = await params;
  const team = await getTeam(id, text.teamDataError);

  if (!team) {
    notFound();
  }

  const matches = await getTeamMatches(
    id,
    text.teamMatchesError,
  );

  const overallRating = Math.round(
    (team.attack + team.defense + team.midfield) / 3,
  );

  const homeAdvantagePercentage = Math.round(
    (team.home_advantage - 1) * 100,
  );

  const dateLocale =
    locale === "ar"
      ? "ar"
      : locale === "sv"
        ? "sv-SE"
        : "en-US";

  return (
    <main
      dir={direction}
      style={{
        minHeight: "100vh",
        padding: "36px 20px",
        background:
          "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        color: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <Link
            href="/teams"
            style={secondaryLinkStyle}
          >
            {text.backToTeams}
          </Link>

          <Link
            href="/"
            style={secondaryLinkStyle}
          >
            {text.dashboard}
          </Link>
        </div>

        <section
          style={{
            padding: "30px",
            borderRadius: "26px",
            border: "1px solid #1e293b",
            backgroundColor:
              "rgba(15, 23, 42, 0.92)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "22px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#064e3b",
                color: "#6ee7b7",
                fontSize: "42px",
                fontWeight: 950,
              }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#34d399",
                  fontSize: "14px",
                  fontWeight: 900,
                }}
              >
                {text.profile}
              </p>

              <h1
                style={{
                  margin: "8px 0 0",
                  fontSize: "40px",
                  fontWeight: 950,
                }}
              >
                {team.name}
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "#94a3b8",
                }}
              >
                {team.country &&
                team.country.toLowerCase() !== "unknown"
                  ? team.country
                  : text.unknownCountry}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "14px",
                }}
              >
                {team.sportmonks_id ? (
                  <StatusBadge
                    connected
                    text={`${text.connectedSportmonks}: ${team.sportmonks_id}`}
                  />
                ) : (
                  <StatusBadge
                    connected={false}
                    text={text.manualTeam}
                  />
                )}

                <StatusBadge
                  connected
                  text={`Team ID: ${team.id}`}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "22px",
          }}
        >
          <StatCard
            title={text.attack}
            value={team.attack}
          />

          <StatCard
            title={text.defense}
            value={team.defense}
          />

          <StatCard
            title={text.midfield}
            value={team.midfield}
          />

          <StatCard
            title={text.overallRating}
            value={overallRating}
          />

          <StatCard
            title={text.elo}
            value={team.elo}
          />

          <StatCard
            title={text.homeAdvantage}
            value={`${homeAdvantagePercentage >= 0 ? "+" : ""}${homeAdvantagePercentage}%`}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginTop: "22px",
          }}
        >
          <RatingPanel
            title={text.attackingStrength}
            value={team.attack}
          />

          <RatingPanel
            title={text.defensiveStrength}
            value={team.defense}
          />

          <RatingPanel
            title={text.midfieldStrength}
            value={team.midfield}
          />
        </section>

        <section
          style={{
            marginTop: "22px",
            padding: "26px",
            borderRadius: "22px",
            border: "1px solid #1e293b",
            backgroundColor:
              "rgba(15, 23, 42, 0.92)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "25px",
            }}
          >
            {text.recentMatches}
          </h2>

          {matches.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0,1fr) auto minmax(0,1fr)",
                    gap: "16px",
                    alignItems: "center",
                    padding: "18px",
                    borderRadius: "16px",
                    border: "1px solid #334155",
                    backgroundColor:
                      "rgba(2,6,23,0.65)",
                    color: "#f8fafc",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      textAlign:
                        direction === "rtl"
                          ? "right"
                          : "left",
                      fontWeight: 850,
                    }}
                  >
                    {match.home_team}
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 950,
                      }}
                    >
                      {match.home_score !== null &&
                      match.away_score !== null
                        ? `${match.home_score} - ${match.away_score}`
                        : new Date(
                            match.date,
                          ).toLocaleTimeString(
                            dateLocale,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#94a3b8",
                        fontSize: "12px",
                      }}
                    >
                      {new Date(
                        match.date,
                      ).toLocaleDateString(
                        dateLocale,
                      )}
                    </div>

                    {match.league_name ? (
                      <div
                        style={{
                          marginTop: "5px",
                          color: "#64748b",
                          fontSize: "11px",
                        }}
                      >
                        {match.league_name}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      textAlign:
                        direction === "rtl"
                          ? "left"
                          : "right",
                      fontWeight: 850,
                    }}
                  >
                    {match.away_team}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: "20px",
                padding: "26px",
                borderRadius: "16px",
                border: "1px dashed #475569",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              {text.noMatches}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

async function getTeamMatches(
  id: string,
  errorMessage: string,
): Promise<Match[]> {
  const response = await fetch(
    `${API_URL}/matches?team_id=${encodeURIComponent(id)}&limit=10`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return (await response.json()) as Match[];
}

async function getTeam(
  id: string,
  errorMessage: string,
): Promise<Team | null> {
  const response = await fetch(
    `${API_URL}/teams/${id}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return (await response.json()) as Team;
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <article
      style={{
        padding: "20px",
        borderRadius: "18px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.92)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#94a3b8",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "10px 0 0",
          color: "#34d399",
          fontSize: "30px",
          fontWeight: 950,
        }}
      >
        {value}
      </p>
    </article>
  );
}

function RatingPanel({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <article
      style={{
        padding: "22px",
        borderRadius: "20px",
        border: "1px solid #1e293b",
        backgroundColor:
          "rgba(15, 23, 42, 0.92)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "17px",
          }}
        >
          {title}
        </h3>

        <strong
          style={{
            color: "#34d399",
            fontSize: "20px",
          }}
        >
          {value}
        </strong>
      </div>

      <div
        style={{
          width: "100%",
          height: "12px",
          overflow: "hidden",
          borderRadius: "999px",
          backgroundColor: "#020617",
        }}
      >
        <div
          style={{
            width: `${Math.min(
              Math.max(value, 0),
              100,
            )}%`,
            height: "100%",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, #059669, #34d399)",
          }}
        />
      </div>
    </article>
  );
}

function StatusBadge({
  connected,
  text,
}: {
  connected: boolean;
  text: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "7px 11px",
        borderRadius: "999px",
        backgroundColor: connected
          ? "#064e3b"
          : "#78350f",
        color: connected
          ? "#6ee7b7"
          : "#fde68a",
        fontSize: "12px",
        fontWeight: 900,
      }}
    >
      {text}
    </span>
  );
}

const secondaryLinkStyle = {
  padding: "11px 16px",
  borderRadius: "11px",
  border: "1px solid #475569",
  color: "#f8fafc",
  textDecoration: "none",
  fontWeight: 900,
};
