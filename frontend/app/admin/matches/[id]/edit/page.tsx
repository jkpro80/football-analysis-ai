import MatchForm from "@/components/MatchForm";
import { notFound } from "next/navigation";

type Team = {
  id: number;
  name: string;
  country: string;
  attack: number;
  defense: number;
  midfield: number;
  elo: number;
  home_advantage: number;
  goals_scored: number;
  goals_conceded: number;
};

type Match = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  date: string;
  status: string;
  home_team: Team;
  away_team: Team;
};

async function getMatch(
  matchId: string
): Promise<Match | null> {
  const response = await fetch(
    `${process.env.INTERNAL_API_URL ??
      process.env.BACKEND_API_URL ??
      "http://backend:8000"}/matches/${matchId}`,
    {
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("تعذر تحميل بيانات المباراة");
  }

  return response.json();
}

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    notFound();
  }

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
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            marginBottom: "28px",
            fontSize: "38px",
          }}
        >
          تعديل المباراة
        </h1>

        <p
          style={{
            marginBottom: "26px",
            color: "#64748b",
            fontSize: "18px",
          }}
        >
          {match.home_team.name}
          {" VS "}
          {match.away_team.name}
        </p>

        <MatchForm match={match} />
      </div>
    </main>
  );
}