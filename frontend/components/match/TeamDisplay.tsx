import type { Team } from "@/types/prediction";

type TeamDisplayProps = {
  team: Team;
  side: "HOME" | "AWAY";
  expectedGoals: number;
};

function TeamLogo({
  name,
  logo,
}: {
  name: string;
  logo: string | null;
}) {
  if (logo) {
    return (
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-white/95 p-4 shadow-xl shadow-black/20">
        <img
          src={logo}
          alt={`شعار ${name}`}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 text-4xl font-black text-white shadow-xl shadow-black/20">
      {name.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export default function TeamDisplay({
  team,
  side,
  expectedGoals,
}: TeamDisplayProps) {
  const isHome = side === "HOME";

  return (
    <div
      className={`flex flex-col items-center text-center ${
        isHome ? "lg:items-start lg:text-right" : "lg:items-end lg:text-left"
      }`}
    >
      <TeamLogo
  name={team.name}
  logo={
    team.logo_url ??
    team.logo ??
    null
  }
/>

      <p className="mt-5 text-xs font-black tracking-[0.25em] text-slate-500">
        {isHome ? "HOME TEAM" : "AWAY TEAM"}
      </p>

      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
        {team.name}
      </h2>

      {team.country && (
        <p className="mt-2 text-sm text-slate-500">{team.country}</p>
      )}

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-3">
        <p className="text-xs text-slate-500">الأهداف المتوقعة</p>
        <p className="mt-1 text-2xl font-black text-cyan-300">
          {Number(expectedGoals).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
