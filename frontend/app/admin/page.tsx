import Link from "next/link";

import DataManagementPanel from "@/components/admin/DataManagementPanel";
import MatchStatusChart from "@/components/MatchStatusChart";

type Team = {
  id: number;
  name: string;
  country: string;
};

type Match = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  date: string;
  status: string;
  home_team: string;
  away_team: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

async function fetchJson<T>(
  path: string,
  fallback: T,
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `API request failed for ${path}: ${response.status}`,
      );
      return fallback;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(
      `Unable to connect to Backend for ${path}:`,
      error,
    );
    return fallback;
  }
}

async function getTeams(): Promise<Team[]> {
  const data = await fetchJson<unknown>(
    "/teams?limit=1000",
    [],
  );

  return Array.isArray(data) ? (data as Team[]) : [];
}

async function getMatches(): Promise<Match[]> {
  const data = await fetchJson<unknown>(
    "/matches",
    [],
  );

  return Array.isArray(data) ? (data as Match[]) : [];
}

function normalizeStatus(status: string): string {
  const normalized = String(status).toLowerCase().trim();

  const statusMap: Record<string, string> = {
    "1": "scheduled",
    ns: "scheduled",
    scheduled: "scheduled",

    "2": "live",
    live: "live",
    inplay: "live",

    "5": "finished",
    ft: "finished",
    finished: "finished",

    postponed: "postponed",
    cancelled: "cancelled",
    canceled: "cancelled",
  };

  return statusMap[normalized] ?? normalized;
}
function translateStatus(status: string) {
  const statuses: Record<string, string> = {
    scheduled: "مجدولة",
    live: "مباشرة",
    finished: "منتهية",
    postponed: "مؤجلة",
    cancelled: "ملغاة",
  };

    const normalizedStatus = normalizeStatus(status);

  return statuses[normalizedStatus] ?? status;
}

function getStatusBackground(status: string) {
  const colors: Record<string, string> = {
    scheduled: "#dbeafe",
    live: "#fee2e2",
    finished: "#dcfce7",
    postponed: "#fef3c7",
    cancelled: "#e2e8f0",
  };

  return colors[normalizeStatus(status)] ?? "#e2e8f0";
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    scheduled: "#1d4ed8",
    live: "#b91c1c",
    finished: "#15803d",
    postponed: "#b45309",
    cancelled: "#475569",
  };

  return colors[normalizeStatus(status)] ?? "#0f172a";
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "20px",
        padding: "24px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
        }}
      >
        {title}
      </p>

      <strong
        style={{
          display: "block",
          marginTop: "10px",
          fontSize: "36px",
        }}
      >
        {value}
      </strong>

      <p
        style={{
          margin: "8px 0 0",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [teams, matches] = await Promise.all([
    getTeams(),
    getMatches(),
  ]);

  const liveMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "live",
  ).length;

  const scheduledMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "scheduled",
  ).length;

  const finishedMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "finished",
  ).length;

  const postponedMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "postponed",
  ).length;

  const cancelledMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "cancelled",
  ).length;

  const recentMatches = matches.slice(0, 5);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              Football Analysis AI
            </p>

            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "40px",
              }}
            >
              لوحة التحكم
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/admin/teams"
              style={{
                padding: "11px 16px",
                border: "1px solid #0f766e",
                borderRadius: "10px",
                textDecoration: "none",
                color: "#0f766e",
                fontWeight: 800,
              }}
            >
              إدارة الفرق
            </Link>

            <Link
              href="/admin/teams/new"
              style={{
                padding: "11px 16px",
                borderRadius: "10px",
                backgroundColor: "#0f766e",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              + إضافة فريق
            </Link>

            <Link
              href="/admin/matches"
              style={{
                padding: "11px 16px",
                border: "1px solid #2563eb",
                borderRadius: "10px",
                textDecoration: "none",
                color: "#2563eb",
                fontWeight: 800,
              }}
            >
              إدارة المباريات
            </Link>

            <Link
              href="/admin/matches/new"
              style={{
                padding: "11px 16px",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              + إضافة مباراة
            </Link>
          </div>
        </header>

        <DataManagementPanel />

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          <StatCard
            title="عدد الفرق"
            value={teams.length}
            description="جميع الفرق المسجلة"
          />

          <StatCard
            title="عدد المباريات"
            value={matches.length}
            description="جميع المباريات في النظام"
          />

          <StatCard
            title="المباريات المباشرة"
            value={liveMatches}
            description="المباريات بحالة مباشرة"
          />

          <StatCard
            title="المباريات المجدولة"
            value={scheduledMatches}
            description="المباريات القادمة"
          />
        </section>

        <MatchStatusChart
          scheduled={scheduledMatches}
          live={liveMatches}
          finished={finishedMatches}
          postponed={postponedMatches}
          cancelled={cancelledMatches}
        />

        <section
          style={{
            marginTop: "28px",
            border: "1px solid #cbd5e1",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "26px",
                }}
              >
                آخر المباريات
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#64748b",
                }}
              >
                أحدث المباريات المتاحة في النظام
              </p>
            </div>

            <Link
              href="/admin/matches"
              style={{
                textDecoration: "none",
                fontWeight: 800,
                color: "#0f766e",
              }}
            >
              عرض جميع المباريات
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <p>لا توجد مباريات حاليًا.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              {recentMatches.map((match) => (
                <div
                  key={match.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: "19px",
                      }}
                    >
                      {match.home_team}
                      {" VS "}
                      {match.away_team}
                    </strong>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                      }}
                    >
                      {match.date}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "7px 12px",
                        borderRadius: "999px",
                        backgroundColor:
                          getStatusBackground(match.status),
                        color: getStatusColor(match.status),
                        fontWeight: 700,
                      }}
                    >
                      {translateStatus(match.status)}
                    </span>

                    <Link
                      href={`/matches/${match.id}`}
                      style={{
                        padding: "9px 14px",
                        borderRadius: "10px",
                        border: "1px solid #94a3b8",
                        color: "inherit",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      عرض التحليل
                    </Link>

                    <Link
                      href={`/predictions/${match.id}`}
                      style={{
                        padding: "9px 14px",
                        borderRadius: "10px",
                        backgroundColor: "#10b981",
                        color: "#052e16",
                        textDecoration: "none",
                        fontWeight: 800,
                      }}
                    >
                      التوقع
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
