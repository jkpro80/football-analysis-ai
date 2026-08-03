type StatItem = {
  label: string;
  value: string;
  caption: string;
  icon: string;
  tone: "cyan" | "emerald" | "amber" | "violet" | "rose" | "blue";
};

const DEFAULT_STATS: StatItem[] = [
  {
    label: "مباريات اليوم",
    value: "62",
    caption: "عبر جميع الدوريات",
    icon: "⚽",
    tone: "cyan",
  },
  {
    label: "مباشر الآن",
    value: "11",
    caption: "يتم تحديثها لحظيًا",
    icon: "●",
    tone: "rose",
  },
  {
    label: "متوسط الأهداف",
    value: "2.87",
    caption: "لكل مباراة",
    icon: "🥅",
    tone: "emerald",
  },
  {
    label: "متوسط الركنيات",
    value: "10.4",
    caption: "لكل مباراة",
    icon: "🚩",
    tone: "amber",
  },
  {
    label: "متوسط البطاقات",
    value: "4.7",
    caption: "بطاقة صفراء",
    icon: "▰",
    tone: "violet",
  },
  {
    label: "دقة التوقعات",
    value: "85%",
    caption: "آخر 30 يومًا",
    icon: "◎",
    tone: "blue",
  },
];

const toneClasses = {
  cyan: {
    border: "border-cyan-400/20",
    icon: "bg-cyan-400/10 text-cyan-300",
    value: "text-cyan-300",
  },
  emerald: {
    border: "border-emerald-400/20",
    icon: "bg-emerald-400/10 text-emerald-300",
    value: "text-emerald-300",
  },
  amber: {
    border: "border-amber-400/20",
    icon: "bg-amber-400/10 text-amber-300",
    value: "text-amber-300",
  },
  violet: {
    border: "border-violet-400/20",
    icon: "bg-violet-400/10 text-violet-300",
    value: "text-violet-300",
  },
  rose: {
    border: "border-rose-400/20",
    icon: "bg-rose-400/10 text-rose-300",
    value: "text-rose-300",
  },
  blue: {
    border: "border-blue-400/20",
    icon: "bg-blue-400/10 text-blue-300",
    value: "text-blue-300",
  },
} as const;

type HomeStatsBarProps = {
  stats?: StatItem[];
};

export default function HomeStatsBar({
  stats = DEFAULT_STATS,
}: HomeStatsBarProps) {
  return (
    <section
      dir="rtl"
      aria-label="إحصائيات المنصة"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {stats.map((item) => {
        const tone = toneClasses[item.tone];

        return (
          <article
            key={item.label}
            className={`rounded-2xl border bg-slate-950/55 p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900/70 ${tone.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">
                  {item.label}
                </p>

                <p className={`mt-2 text-2xl font-black ${tone.value}`}>
                  {item.value}
                </p>

                <p className="mt-1 text-[11px] text-slate-600">
                  {item.caption}
                </p>
              </div>

              <span
                className={`grid h-10 w-10 place-items-center rounded-xl text-base font-black ${tone.icon}`}
              >
                {item.icon}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}