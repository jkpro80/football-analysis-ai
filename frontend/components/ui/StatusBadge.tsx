type StatusBadgeProps = {
  label: string;
  tone?: "cyan" | "green" | "red" | "amber" | "violet";
};

export default function StatusBadge({
  label,
  tone = "cyan",
}: StatusBadgeProps) {
  const classes = {
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    red: "border-rose-400/20 bg-rose-500/10 text-rose-300",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-300",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${classes}`}
    >
      {label}
    </span>
  );
}
