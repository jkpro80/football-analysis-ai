import Link from "next/link";
import { notFound } from "next/navigation";

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

type TeamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.BACKEND_API_URL ??
  "http://backend:8000";

export default async function TeamDetailsPage({
  params,
}: TeamPageProps) {
  const { id } = await params;
  const team = await getTeam(id);

  if (!team) {
    notFound();
  }

  const overallRating = Math.round(
    (team.attack +
      team.defense +
      team.midfield) /
      3,
  );

  const homeAdvantagePercentage =
    Math.round(
      (team.home_advantage - 1) * 100,
    );

  return (
    <main
      dir="rtl"
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
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <Link
            href="/admin/teams"
            style={secondaryLinkStyle}
          >
            العودة إلى إدارة الفرق
          </Link>

          <Link
            href="/admin"
            style={secondaryLinkStyle}
          >
            لوحة التحكم
          </Link>
        </div>

        <section
          style={{
            padding: "30px",
            borderRadius: "26px",
            border:
              "1px solid #1e293b",
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
                justifyContent:
                  "center",
                borderRadius: "50%",
                backgroundColor:
                  "#064e3b",
                color: "#6ee7b7",
                fontSize: "42px",
                fontWeight: 950,
              }}
            >
              {team.name
                .charAt(0)
                .toUpperCase()}
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
                TEAM PROFILE
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
                {team.country ||
                  "الدولة غير محددة"}
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
                    text={`مرتبط بـ Sportmonks: ${team.sportmonks_id}`}
                  />
                ) : (
                  <StatusBadge
                    connected={false}
                    text="فريق مضاف يدويًا"
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
            title="الهجوم"
            value={team.attack}
          />

          <StatCard
            title="الدفاع"
            value={team.defense}
          />

          <StatCard
            title="الوسط"
            value={team.midfield}
          />

          <StatCard
            title="التقييم العام"
            value={overallRating}
          />

          <StatCard
            title="ELO"
            value={team.elo}
          />

          <StatCard
            title="أفضلية الأرض"
            value={`+${homeAdvantagePercentage}%`}
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
            title="القوة الهجومية"
            value={team.attack}
          />

          <RatingPanel
            title="القوة الدفاعية"
            value={team.defense}
          />

          <RatingPanel
            title="قوة خط الوسط"
            value={team.midfield}
          />
        </section>

        <section
          style={{
            marginTop: "22px",
            padding: "26px",
            borderRadius: "22px",
            border:
              "1px solid #1e293b",
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
            آخر المباريات
          </h2>

          <p
            style={{
              margin: "12px 0 0",
              color: "#94a3b8",
              lineHeight: 1.8,
            }}
          >
            في الخطوة القادمة سنربط هذا
            القسم بآخر مباريات الفريق،
            ونحسب عدد الانتصارات والتعادلات
            والخسائر ومتوسط الأهداف.
          </p>

          <div
            style={{
              marginTop: "20px",
              padding: "26px",
              borderRadius: "16px",
              border:
                "1px dashed #475569",
              color: "#64748b",
              textAlign: "center",
            }}
          >
            لا توجد مباريات مرتبطة بهذا
            القسم حاليًا.
          </div>
        </section>
      </div>
    </main>
  );
}

async function getTeam(
  id: string,
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
    throw new Error(
      "تعذر تحميل بيانات الفريق.",
    );
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
          justifyContent:
            "space-between",
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

