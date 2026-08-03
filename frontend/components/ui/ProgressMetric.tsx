type ProgressMetricProps = {
  label: string;
  value: number;
  suffix?: string;
  accent?: "cyan" | "violet" | "emerald" | "amber";
};

const clamp = (value: number) =>
  Math.min(Math.max(value, 0), 100);

export default function ProgressMetric({
  label,
  value,
  suffix = "%",
  accent = "cyan",
}: ProgressMetricProps) {
  const gradient = {
    cyan: "from-cyan-500 to-blue-500",
    violet: "from-violet-500 to-fuchsia-500",
    emerald: "from-emerald-500 to-teal-400",
    amber: "from-amber-500 to-orange-500",
  }[accent];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-300">
          {label}
        </span>

        <strong className="text-lg text-white">
          {value.toFixed(1)}
          {suffix}
        </strong>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-l ${gradient} transition-all duration-700`}
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}
