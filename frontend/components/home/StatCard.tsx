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
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 sm:rounded-3xl sm:p-6">
      <p className="text-[9px] leading-3 text-slate-500 sm:text-sm sm:leading-normal">{title}</p>

      <p
        className={`mt-1 text-xl font-black leading-none sm:mt-3 sm:text-3xl ${valueClassName}`}
      >
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-[8px] leading-3 text-slate-600 sm:mt-2 sm:text-xs sm:leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}


