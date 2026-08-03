import type { IconType } from "react-icons";

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: IconType;
};

export default function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>

          <p className="mt-3 text-3xl font-black text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}