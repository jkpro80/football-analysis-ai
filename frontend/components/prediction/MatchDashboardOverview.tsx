"use client";

import { useLocale } from "@/context/locale-context";

type Team = {
  name: string;
  logo?: string | null;
  logo_url?: string | null;
  image_path?: string | null;
  form?: string | string[] | null;
};

type Comparison = readonly [string, number | null | undefined, number | null | undefined];

type Score = {
  score: string;
  probability: number;
};

type Props = {
  home: Team;
  away: Team;
  comparisons: readonly Comparison[];
  topScores: Score[];
  homeXg: number;
  awayXg: number;
  totalXg: number;
  confidence: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  advancedAvailable: boolean;
};

const COPY = {
  ar: {
    teamComparison: "مقارنة الفريقين",
    aiRadar: "بصمة الأداء بالذكاء الاصطناعي",
    recentForm: "حالة الفريقين",
    lastFive: "آخر 5 مباريات",
    topScores: "النتائج الأكثر احتمالًا",
    confidence: "ثقة المحرك",
    homeXg: "xG صاحب الأرض",
    awayXg: "xG الفريق الضيف",
    totalXg: "إجمالي xG",
    homeWin: "فوز صاحب الأرض",
    awayWin: "فوز الضيف",
    draw: "التعادل",
    noForm: "لا تتوفر فورمة حديثة",
    locked: "هذه المقارنة متاحة لمشتركي Pro وPremium",
  },
  en: {
    teamComparison: "Team Comparison",
    aiRadar: "AI Performance Profile",
    recentForm: "Team Form",
    lastFive: "Last 5 matches",
    topScores: "Most Likely Scores",
    confidence: "Engine Confidence",
    homeXg: "Home xG",
    awayXg: "Away xG",
    totalXg: "Total xG",
    homeWin: "Home Win",
    awayWin: "Away Win",
    draw: "Draw",
    noForm: "Recent form unavailable",
    locked: "This comparison is available with Pro and Premium",
  },
  sv: {
    teamComparison: "Lagjämförelse",
    aiRadar: "AI-prestandaprofil",
    recentForm: "Lagform",
    lastFive: "Senaste 5 matcherna",
    topScores: "Troligaste resultaten",
    confidence: "Modellkonfidens",
    homeXg: "Hemma-xG",
    awayXg: "Borta-xG",
    totalXg: "Totalt xG",
    homeWin: "Hemmaseger",
    awayWin: "Bortaseger",
    draw: "Oavgjort",
    noForm: "Aktuell form saknas",
    locked: "Jämförelsen är tillgänglig med Pro och Premium",
  },
} as const;

function clamp(value: number) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

function logo(team: Team) {
  return team.logo_url || team.logo || team.image_path || null;
}

function formItems(value: Team["form"]): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim().toUpperCase().slice(0, 1)).filter((v) => ["W", "D", "L"].includes(v)).slice(-5);
  }
  if (typeof value === "string") {
    return value.toUpperCase().replace(/[^WDL]/g, "").slice(-5).split("");
  }
  return [];
}

function FormRow({ team, empty }: { team: Team; empty: string }) {
  const items = formItems(team.form);
  const src = logo(team);
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-slate-950/35 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-slate-950/70 p-1.5">
          {src ? <img src={src} alt={team.name} className="h-full w-full object-contain" /> : <span className="font-black text-slate-500">{team.name.slice(0, 1)}</span>}
        </div>
        <strong className="truncate text-sm text-white">{team.name}</strong>
      </div>
      {items.length ? (
        <div dir="ltr" className="flex shrink-0 gap-1.5">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className={["grid h-7 w-7 place-items-center rounded-full border text-[10px] font-black", item === "W" ? "border-emerald-400/25 bg-emerald-400/12 text-emerald-300" : item === "D" ? "border-slate-400/25 bg-slate-400/10 text-slate-300" : "border-rose-400/25 bg-rose-400/10 text-rose-300"].join(" ")}>{item}</span>
          ))}
        </div>
      ) : <span className="text-[11px] text-slate-600">{empty}</span>}
    </div>
  );
}

function Radar({ comparisons, homeName, awayName }: { comparisons: readonly Comparison[]; homeName: string; awayName: string }) {
  const metrics = comparisons.slice(0, 6);
  const center = 120;
  const radius = 86;
  const pointsFor = (side: 1 | 2) => metrics.map((item, index) => {
    const a = Math.abs(Number(item[1]) || 0);
    const b = Math.abs(Number(item[2]) || 0);
    const max = Math.max(a, b, 1);
    const value = side === 1 ? a : b;
    const r = radius * (0.24 + 0.76 * Math.min(1, value / max));
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length;
    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
  }).join(" ");
  const ring = (scale: number) => metrics.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length;
    return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
  }).join(" ");

  if (metrics.length < 3) return null;

  return (
    <>
      <svg viewBox="0 0 240 240" className="mx-auto mt-3 h-[245px] w-full max-w-[330px] overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={ring(scale)} fill="none" stroke="rgba(148,163,184,.12)" strokeWidth="1" />)}
        {metrics.map((_, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length;
          return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="rgba(148,163,184,.10)" strokeWidth="1" />;
        })}
        <polygon points={pointsFor(1)} fill="rgba(45,212,191,.10)" stroke="rgb(45,212,191)" strokeWidth="2" />
        <polygon points={pointsFor(2)} fill="rgba(251,113,133,.09)" stroke="rgb(251,113,133)" strokeWidth="2" />
      </svg>
      <div dir="ltr" className="mt-1 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" />{homeName}</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" />{awayName}</span>
      </div>
    </>
  );
}

export default function MatchDashboardOverview({ home, away, comparisons, topScores, homeXg, awayXg, totalXg, confidence, homeWin, draw, awayWin, advancedAvailable }: Props) {
  const { locale, direction } = useLocale();
  const t = COPY[locale];
  const maxComparison = (a: number, b: number) => Math.max(Math.abs(a), Math.abs(b), 1);
  const kpis = [
    ["◎", homeXg.toFixed(2), t.homeXg, "text-emerald-300"],
    ["◉", awayXg.toFixed(2), t.awayXg, "text-rose-300"],
    ["Σ", totalXg.toFixed(2), t.totalXg, "text-violet-300"],
    ["✦", `${clamp(confidence).toFixed(0)}%`, t.confidence, "text-cyan-300"],
    ["⌂", `${clamp(homeWin).toFixed(1)}%`, t.homeWin, "text-emerald-300"],
    ["×", `${clamp(draw).toFixed(1)}%`, t.draw, "text-amber-300"],
  ] as const;

  return (
    <section dir={direction} className="space-y-3">
      {advancedAvailable ? (
      <div className="grid gap-3 xl:grid-cols-3">
        <article className="malx-panel p-5">
          <h2 className="text-base font-black text-white">{t.teamComparison}</h2>
          <div className="mt-4 space-y-3">
            {comparisons.slice(0, 8).map(([label, homeValue, awayValue]) => {
              const hv = Number(homeValue) || 0;
              const av = Number(awayValue) || 0;
              const max = maxComparison(hv, av);
              return (
                <div key={label}>
                  <div className="grid grid-cols-[54px_1fr_92px_1fr_54px] items-center gap-2 text-[10px]">
                    <strong dir="ltr" className="text-right text-rose-300">{av.toFixed(1)}</strong>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="ms-auto h-full rounded-full bg-rose-400" style={{ width: `${Math.max(5, (Math.abs(av) / max) * 100)}%` }} /></div>
                    <span className="truncate text-center text-slate-500">{label}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(5, (Math.abs(hv) / max) * 100)}%` }} /></div>
                    <strong dir="ltr" className="text-emerald-300">{hv.toFixed(1)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="malx-panel p-5">
          <h2 className="text-center text-base font-black text-white">{t.aiRadar}</h2>
          <Radar comparisons={comparisons} homeName={home.name} awayName={away.name} />
        </article>

        <article className="malx-panel p-5">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-base font-black text-white">{t.recentForm}</h2>
            <span className="text-[10px] text-slate-600">{t.lastFive}</span>
          </div>
          <div className="mt-4 space-y-3">
            <FormRow team={home} empty={t.noForm} />
            <FormRow team={away} empty={t.noForm} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/[0.05] bg-slate-950/35 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-500"><span>{t.homeWin}</span><strong dir="ltr" className="text-emerald-300">{clamp(homeWin).toFixed(1)}%</strong></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${clamp(homeWin)}%` }} /></div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500"><span>{t.awayWin}</span><strong dir="ltr" className="text-rose-300">{clamp(awayWin).toFixed(1)}%</strong></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-rose-400" style={{ width: `${clamp(awayWin)}%` }} /></div>
          </div>
        </article>
      </div>
      ) : (
        <div className="malx-panel p-7 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/[0.08] text-xl">🔒</div>
          <h2 className="mt-3 text-base font-black text-white">{t.teamComparison}</h2>
          <p className="mt-1 text-xs text-slate-500">{t.locked}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([icon, value, label, color]) => (
          <article key={label} className="malx-panel px-4 py-5 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-slate-300">{icon}</div>
            <strong dir="ltr" className={`mt-3 block text-2xl font-black ${color}`}>{value}</strong>
            <span className="mt-1 block text-[11px] leading-5 text-slate-500">{label}</span>
          </article>
        ))}
      </div>

      {advancedAvailable && topScores.length > 0 && (
        <article className="malx-panel p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-base font-black text-white">{t.topScores}</h2><span className="text-[10px] text-slate-600">Top 5</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {topScores.slice(0, 5).map((score, index) => (
              <div key={`${score.score}-${index}`} className="rounded-xl border border-white/[0.05] bg-slate-950/35 px-3 py-3 text-center">
                <strong dir="ltr" className="text-lg font-black text-white">{score.score}</strong>
                <span dir="ltr" className="mt-1 block text-[11px] font-bold text-cyan-300">{Number(score.probability || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
