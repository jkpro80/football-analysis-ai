import type { DashboardTeam } from "./types";

export default function TeamLogo({
  team,
}: {
  team: DashboardTeam;
}) {
  if (!team.logo) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl font-black text-cyan-300">
        {team.name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={team.logo}
      alt={team.name}
      className="h-16 w-16 object-contain"
    />
  );
}
