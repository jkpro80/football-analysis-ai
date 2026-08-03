export default function StatCard({
  title,
  value,
  subtitle,
  valueClassName,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  valueClassName: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
      <p className="text-sm text-slate-500">{title}</p>

      <p
        className={`mt-3 text-3xl font-black ${valueClassName}`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}
