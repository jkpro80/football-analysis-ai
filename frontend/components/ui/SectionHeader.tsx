type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: "cyan" | "violet" | "emerald" | "amber";
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  accent = "cyan",
}: SectionHeaderProps) {
  const accentClass = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  }[accent];

  return (
    <div>
      {eyebrow && (
        <p
          className={`text-xs font-bold uppercase tracking-[0.25em] ${accentClass}`}
        >
          {eyebrow}
        </p>
      )}

      <h2 className="mt-2 text-2xl font-black text-white">
        {title}
      </h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}
