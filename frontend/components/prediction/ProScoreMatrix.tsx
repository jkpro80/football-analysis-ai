"use client";

import { useLocale } from "@/context/locale-context";

type ScoreMatrixCell = { home_goals: number; away_goals: number; score: string; probability: number; };
type ProScoreMatrixProps = { matrix?: ScoreMatrixCell[] | null; mostLikelyScore?: string | null; recommendedScore?: string | null; homeWin?: number; draw?: number; awayWin?: number; };

const TXT = {
  ar: { title:"خريطة احتمالات النتائج", subtitle:"الصفوف تمثل أهداف الفريق المضيف والأعمدة تمثل أهداف الفريق الضيف.", unavailable:"خريطة احتمالات النتائج غير متوفرة لهذه المباراة.", top:"أعلى نتيجة منفردة", recommended:"النتيجة الموافقة", entropy:"تشتت النتائج", top5:"تركيز أفضل 5 نتائج", home:"فوز المضيف", draw:"التعادل", away:"فوز الضيف", axis:"مضيف / ضيف" },
  en: { title:"Score Probability Matrix", subtitle:"Rows are home goals and columns are away goals.", unavailable:"The score probability matrix is unavailable for this match.", top:"Highest single score", recommended:"Winner-consistent score", entropy:"Score dispersion", top5:"Top-5 concentration", home:"Home win", draw:"Draw", away:"Away win", axis:"Home / Away" },
  sv: { title:"Resultatmatris", subtitle:"Rader visar hemmamål och kolumner bortamål.", unavailable:"Resultatmatrisen är inte tillgänglig för den här matchen.", top:"Högsta enskilda resultat", recommended:"Resultat i linje med vinnaren", entropy:"Resultatspridning", top5:"Koncentration topp 5", home:"Hemmaseger", draw:"Oavgjort", away:"Bortaseger", axis:"Hemma / Borta" },
} as const;

function pct(v:number){ return `${(Number(v)||0).toFixed(2)}%`; }
function scoreProb(matrix: ScoreMatrixCell[], score?: string | null){ return matrix.find(c=>c.score===score)?.probability ?? 0; }
function entropy(matrix: ScoreMatrixCell[]){
  const ps=matrix.map(c=>Math.max(0,Number(c.probability)||0)/100).filter(p=>p>0);
  if(!ps.length) return 0;
  const h=-ps.reduce((s,p)=>s+p*Math.log(p),0);
  const max=Math.log(ps.length || 1);
  return max>0 ? (h/max)*100 : 0;
}

export default function ProScoreMatrix({matrix=[],mostLikelyScore,recommendedScore,homeWin=0,draw=0,awayWin=0}:ProScoreMatrixProps){
  const {locale,direction}=useLocale(); const t=TXT[locale];
  if(!Array.isArray(matrix)||!matrix.length) return <section dir={direction} className="rounded-2xl border border-violet-500/20 bg-[#050b1e] p-4"><h2 className="text-xl font-black text-white">{t.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{t.unavailable}</p></section>;
  const maxGoal=Math.max(6,...matrix.flatMap(c=>[c.home_goals,c.away_goals]));
  const goals=Array.from({length:maxGoal+1},(_,i)=>i);
  const lookup=new Map(matrix.map(c=>[`${c.home_goals}-${c.away_goals}`,c]));
  const maxP=Math.max(...matrix.map(c=>Number(c.probability)||0),1);
  const top5=[...matrix].sort((a,b)=>b.probability-a.probability).slice(0,5).reduce((s,c)=>s+(Number(c.probability)||0),0);
  const ent=entropy(matrix);
  return <section dir={direction} className="rounded-2xl border border-cyan-400/15 bg-[#040a18] p-3 sm:p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-[1.4rem] font-black text-white">{t.title}</h2><p className="mt-1 text-[13px] leading-5 text-slate-400">{t.subtitle}</p></div><span className="rounded-full border border-cyan-400/20 px-3 py-1.5 text-[13px] font-black text-cyan-300">0–{maxGoal}</span></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {[[t.top,mostLikelyScore||"—",pct(scoreProb(matrix,mostLikelyScore)),"violet"],[t.recommended,recommendedScore||"—",pct(scoreProb(matrix,recommendedScore)),"emerald"],[t.entropy,`${ent.toFixed(0)}/100`,"Normalized Entropy","cyan"],[t.top5,pct(top5),"Top 5","cyan"]].map(([label,value,note,tone])=><div key={label} className="rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2.5"><div className="text-[12px] font-bold text-slate-400">{label}</div><div className={['mt-0.5 text-[1.4rem] font-black',tone==='violet'?'text-violet-300':tone==='emerald'?'text-emerald-300':'text-cyan-300'].join(' ')} dir="ltr">{value}</div><div className="mt-0.5 text-[12px] text-slate-500">{note}</div></div>)}
    </div>
    <div className="mt-2.5 grid grid-cols-3 gap-2">{[[t.home,homeWin,'text-cyan-300'],[t.draw,draw,'text-white'],[t.away,awayWin,'text-violet-300']].map(([label,val,cls])=><div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950/25 px-3 py-2 text-center"><div className="text-[12px] font-bold text-slate-500">{label}</div><strong className={`mt-0.5 block text-lg font-black ${cls}`} dir="ltr">{pct(Number(val))}</strong></div>)}</div>
    <div className="mt-3 overflow-x-auto pb-1"><div className="min-w-[760px]">
      <div className="grid items-center gap-1.5" style={{gridTemplateColumns:`48px repeat(${goals.length}, minmax(66px,1fr))`}}><div className="text-center text-[12px] font-black text-slate-500">{t.axis}</div>{goals.map(g=><div key={`head-${g}`} className="text-center text-[13px] font-black text-violet-300">{g}</div>)}</div>
      <div className="mt-1 space-y-1">{goals.map(h=><div key={`row-${h}`} className="grid items-stretch gap-1" style={{gridTemplateColumns:`48px repeat(${goals.length}, minmax(66px,1fr))`}}><div className="flex items-center justify-center text-[13px] font-black text-cyan-300">{h}</div>{goals.map(a=>{const c=lookup.get(`${h}-${a}`);const p=Number(c?.probability)||0; const leader=c?.score===mostLikelyScore; const rec=c?.score===recommendedScore; const alpha=Math.min(.72,.05+(p/maxP)*.62); return <div key={`${h}-${a}`} className={["relative flex min-h-[43px] flex-col items-center justify-center rounded-lg border px-1 py-1 text-center",leader?"border-amber-400 ring-1 ring-amber-400/60":rec?"border-emerald-400/50":"border-slate-800"].join(' ')} style={{backgroundColor:`rgba(6,182,212,${alpha})`}}><strong className="text-[14px] font-black leading-none text-white" dir="ltr">{h}-{a}</strong><span className="mt-1 text-[12px] font-black leading-none text-white/90" dir="ltr">{pct(p)}</span></div>})}</div>)}</div>
    </div></div>
  </section>;
}
