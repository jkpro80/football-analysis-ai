/* eslint-disable @next/next/no-img-element */

import type { Team } from "@/types/prediction";

type TeamDisplayProps = {
  team: Team;
  side: "HOME" | "AWAY";
  expectedGoals: number;
};

export default function TeamDisplay({
  team,
  side,
  expectedGoals,
}: TeamDisplayProps) {
  const initials = team.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const sideLabel =
    side === "HOME" ? "المضيف" : "الضيف";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex h-32 w-32 items-center justify-center rounded-[32px] border border-cyan-400/25 bg-slate-950/60 shadow-xl shadow-cyan-950/20">
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cyan-500/10 to-violet-500/10" />

        {team.logo ? (
          <img
            src={team.logo}
            alt={`شعار ${team.name}`}
            className="relative z-10 h-24 w-24 object-contain"
          />
        ) : (
          <span className="relative z-10 text-3xl font-black text-cyan-300">
            {initials}
          </span>
        )}

        <span className="absolute -bottom-3 z-20 rounded-full border border-slate-700 bg-[#020617] px-4 py-1 text-xs font-bold text-slate-300">
          {sideLabel}
        </span>
      </div>

      <h2 className="mt-8 text-2xl font-black text-white">
        {team.name}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {team.country ?? "الدولة غير محددة"}
      </p>

      <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-3">
        <p className="text-xs text-slate-500">
          الأهداف المتوقعة
        </p>

        <p className="mt-1 text-2xl font-black text-cyan-300">
          {expectedGoals.toFixed(2)} xG
        </p>
      </div>
    </div>
  );
}
