import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  accent?: "cyan" | "violet" | "emerald" | "amber";
};

export default function StatCard({
  label,
  value,
  subtitle,
  icon,
  accent = "cyan",
}: StatCardProps) {
  const accentClass = {
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
  }[accent];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {label}
          </p>

          <div className={`mt-2 text-2xl font-black ${accentClass}`}>
            {value}
          </div>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
