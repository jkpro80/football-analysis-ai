type Locale = "ar" | "en" | "sv";

export type MatchIntelligencePlayer = {
  player_id: number;
  player_name: string;
  player_image?: string | null;
  position_id?: number | null;
  position_name?: string | null;
  jersey_number?: number | null;
  formation_field?: string | null;
  formation_position?: number | null;
  is_predicted?: boolean;
};

export type MatchIntelligenceAbsence = {
  player_id: number;
  player_name: string;
  player_image?: string | null;
  position_id?: number | null;
  position_name?: string | null;
  absence_type_name?: string | null;
  absence_type_code?: string | null;
  absence_category: string;
};

export type MatchIntelligenceTeam = {
  team_id: number;
  team_name: string;
  formation?: string | null;
  starter_count: number;
  substitute_count: number;
  predicted_count: number;
  lineup_complete: boolean;
  starter_positions: Record<string, number>;
  starters: MatchIntelligencePlayer[];
  substitutes: MatchIntelligencePlayer[];
  absences: MatchIntelligenceAbsence[];
  absence_count: number;
  absence_categories: Record<string, number>;
  absence_positions: Record<string, number>;
  absence_penalty: number;
  availability_factor: number;
};

export type MatchIntelligenceWeather = {
  available: boolean;
  temperature?: number | null;
  feels_like?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  clouds?: number | null;
  description?: string | null;
  is_rain: boolean;
  is_extreme_heat: boolean;
  is_extreme_cold: boolean;
  severity: number;
  attack_factor: number;
  fatigue_factor: number;
};

export type MatchIntelligenceData = {
  fixture_id: number;
  home: MatchIntelligenceTeam;
  away: MatchIntelligenceTeam;
  weather: MatchIntelligenceWeather;
  features: {
    home_availability_factor: number;
    away_availability_factor: number;
    home_absence_penalty: number;
    away_absence_penalty: number;
    weather_attack_factor: number;
    weather_fatigue_factor: number;
    weather_severity: number;
  };
  warnings: string[];
};

type Props = {
  locale: Locale;
  available: boolean;
  data?: MatchIntelligenceData | null;
};

function percentage(value: number): string { const normalized=Math.max(0,Math.min(1,Number(value)||0)); return `${(normalized*100).toFixed(1)}%`; }
function translatePosition(value:string|null|undefined,locale:Locale){ if(!value)return "—"; const k=value.trim().toLowerCase(); const m:Record<string,Record<Locale,string>>={goalkeeper:{ar:"حارس مرمى",en:"Goalkeeper",sv:"Målvakt"},defender:{ar:"مدافع",en:"Defender",sv:"Försvarare"},midfielder:{ar:"لاعب وسط",en:"Midfielder",sv:"Mittfältare"},attacker:{ar:"مهاجم",en:"Attacker",sv:"Anfallare"}}; return m[k]?.[locale]??value; }
function translateAbsence(value:string|null|undefined,locale:Locale){ if(!value)return "—"; const k=value.trim().toLowerCase(); const m:Record<string,Record<Locale,string>>={injury:{ar:"إصابة",en:"Injury",sv:"Skada"},suspension:{ar:"إيقاف",en:"Suspension",sv:"Avstängning"},doubtful:{ar:"مشكوك في مشاركته",en:"Doubtful",sv:"Osäker"},"calf injury":{ar:"إصابة في ربلة الساق",en:"Calf injury",sv:"Vadskada"},"foot injury":{ar:"إصابة في القدم",en:"Foot injury",sv:"Fotskada"},"muscle injury":{ar:"إصابة عضلية",en:"Muscle injury",sv:"Muskelskada"}}; return m[k]?.[locale]??value; }
function translateWeather(value:string|null|undefined,locale:Locale){ if(!value)return ""; const k=value.trim().toLowerCase(); const m:Record<string,Record<Locale,string>>={"clear sky":{ar:"سماء صافية",en:"Clear sky",sv:"Klar himmel"},"few clouds":{ar:"غيوم قليلة",en:"Few clouds",sv:"Lätt molnighet"},"scattered clouds":{ar:"غيوم متفرقة",en:"Scattered clouds",sv:"Spridda moln"},"broken clouds":{ar:"غائم جزئيًا",en:"Broken clouds",sv:"Delvis molnigt"},"overcast clouds":{ar:"غائم",en:"Overcast",sv:"Mulet"},"light rain":{ar:"أمطار خفيفة",en:"Light rain",sv:"Lätt regn"},"moderate rain":{ar:"أمطار متوسطة",en:"Moderate rain",sv:"Måttligt regn"},rain:{ar:"أمطار",en:"Rain",sv:"Regn"}}; return m[k]?.[locale]??value; }
function translateWarning(value:string,locale:Locale){ const k=value.trim().toLowerCase(); const m:Record<string,Record<Locale,string>>={"home starting lineup is incomplete.":{ar:"التشكيلة الأساسية للفريق المضيف غير مكتملة.",en:"Home starting lineup is incomplete.",sv:"Hemmala gets startelva är ofullständig."},"away starting lineup is incomplete.":{ar:"التشكيلة الأساسية للفريق الضيف غير مكتملة.",en:"Away starting lineup is incomplete.",sv:"Bortalagets startelva är ofullständig."},"fixture weather is unavailable.":{ar:"بيانات الطقس للمباراة غير متوفرة.",en:"Fixture weather is unavailable.",sv:"Väderdata för matchen saknas."}}; return m[k]?.[locale]??value; }
function PlayerAvatar({name,image}:{name:string;image?:string|null}){ return image?<img src={image} alt={name} className="h-9 w-9 shrink-0 rounded-full border border-slate-700 bg-slate-900 object-cover" loading="lazy"/>:<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-black text-cyan-300">{name.trim().charAt(0).toUpperCase()||"?"}</div>; }
function TeamCard({team,locale,labels}:{team:MatchIntelligenceTeam;locale:Locale;labels:any}){ return <article className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3"><div><h3 className="text-lg font-black text-white">{team.team_name}</h3><p className="mt-1 text-sm text-slate-400">{labels.formation}: <strong className="text-cyan-300" dir="ltr">{team.formation??"—"}</strong></p></div><div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.05] px-3 py-2 text-center"><div className="text-[12px] font-bold text-slate-400">{labels.availability}</div><div className="text-lg font-black text-emerald-300" dir="ltr">{percentage(team.availability_factor)}</div></div></header>
  <div className="mt-3 grid grid-cols-3 gap-2 text-center">{[[labels.starters,team.starter_count],[labels.substitutes,team.substitute_count],[labels.absences,team.absence_count]].map(([l,v])=><div key={l} className="rounded-xl border border-slate-800 bg-slate-900/35 px-2 py-2"><div className="text-[12px] font-bold text-slate-500">{l}</div><strong className="mt-0.5 block text-base font-black text-white">{v}</strong></div>)}</div>
  {team.starters.length>0&&<details className="mt-3 rounded-xl border border-slate-800 bg-slate-900/25"><summary className="cursor-pointer px-3 py-2.5 text-sm font-black text-slate-200">{labels.starters} ({team.starter_count})</summary><div className="grid gap-2 border-t border-slate-800 p-2 sm:grid-cols-2">{team.starters.map(p=><div key={`${team.team_id}-s-${p.player_id}`} className="flex items-center gap-2 rounded-lg bg-slate-950/55 p-2"><PlayerAvatar name={p.player_name} image={p.player_image}/><div className="min-w-0"><div className="truncate text-sm font-bold text-white">{p.jersey_number!=null&&<span className="me-1 text-cyan-300">#{p.jersey_number}</span>}{p.player_name}</div><div className="text-[13px] text-slate-500">{translatePosition(p.position_name,locale)}{p.is_predicted?` · ${labels.predicted}`:""}</div></div></div>)}</div></details>}
  <details className="mt-2 rounded-xl border border-slate-800 bg-slate-900/25"><summary className="cursor-pointer px-3 py-2.5 text-sm font-black text-slate-300">{labels.substitutes} ({team.substitute_count})</summary>{team.substitutes.length>0&&<div className="grid gap-2 border-t border-slate-800 p-2 sm:grid-cols-2">{team.substitutes.map(p=><div key={`${team.team_id}-b-${p.player_id}`} className="flex items-center gap-2 rounded-lg bg-slate-950/55 p-2"><PlayerAvatar name={p.player_name} image={p.player_image}/><div className="min-w-0"><div className="truncate text-sm font-bold text-white">{p.player_name}</div><div className="text-[13px] text-slate-500">{translatePosition(p.position_name,locale)}</div></div></div>)}</div>}</details>
  <div className="mt-2 rounded-xl border border-rose-400/10 bg-rose-400/[.025] px-3 py-2.5"><div className="text-sm font-black text-rose-300">{labels.absences} ({team.absence_count})</div>{team.absences.length>0?<div className="mt-2 grid gap-2 sm:grid-cols-2">{team.absences.map(p=><div key={`${team.team_id}-a-${p.player_id}`} className="flex items-center gap-2"><PlayerAvatar name={p.player_name} image={p.player_image}/><div className="min-w-0"><div className="truncate text-sm font-bold text-white">{p.player_name}</div><div className="text-[13px] text-slate-500">{translatePosition(p.position_name,locale)} · {translateAbsence(p.absence_type_name??p.absence_category,locale)}</div></div></div>)}</div>:<p className="mt-1 text-sm text-slate-500">{labels.noAbsences}</p>}</div>
</article>; }
export default function MatchIntelligence({locale,available,data}:Props){
 const text=locale==="sv"?{title:"Match Intelligence",subtitle:"Laguppställningar, frånvaro och väderpåverkan",locked:"Match Intelligence är tillgängligt med Pro och Premium.",upgrade:"Uppgradera abonnemang",formation:"Formation",starters:"Startelva",substitutes:"Avbytare",absences:"Frånvaro",availability:"Tillgänglighet",noAbsences:"Ingen registrerad frånvaro.",predicted:"Prognos",weather:"Väder & påverkan",temperature:"Temperatur",feelsLike:"Känns som",humidity:"Luftfuktighet",wind:"Vind",attackImpact:"Anfallspåverkan",fatigueImpact:"Trötthetspåverkan",noWeather:"Ingen väderdata tillgänglig.",warnings:"Kontextvarningar"}:locale==="en"?{title:"Match Intelligence",subtitle:"Lineups, absences and weather impact",locked:"Match Intelligence is available with Pro and Premium.",upgrade:"Upgrade subscription",formation:"Formation",starters:"Starting XI",substitutes:"Substitutes",absences:"Absences",availability:"Availability",noAbsences:"No recorded absences.",predicted:"Predicted",weather:"Weather & Impact",temperature:"Temperature",feelsLike:"Feels like",humidity:"Humidity",wind:"Wind",attackImpact:"Attack impact",fatigueImpact:"Fatigue impact",noWeather:"No weather data available.",warnings:"Context warnings"}:{title:"ذكاء المباراة",subtitle:"التشكيلة والغيابات وتأثير الظروف الجوية",locked:"ذكاء المباراة متاح لمشتركي Pro وPremium.",upgrade:"ترقية الاشتراك",formation:"الخطة",starters:"التشكيلة الأساسية",substitutes:"البدلاء",absences:"الغيابات",availability:"جاهزية الفريق",noAbsences:"لا توجد غيابات مسجلة.",predicted:"متوقعة",weather:"الطقس وتأثيره",temperature:"درجة الحرارة",feelsLike:"المحسوسة",humidity:"الرطوبة",wind:"الرياح",attackImpact:"تأثير الهجوم",fatigueImpact:"تأثير الإرهاق",noWeather:"لا تتوفر بيانات الطقس.",warnings:"تنبيهات سياق المباراة"};
 if(!available)return <section className="rounded-2xl border border-violet-500/30 bg-[#05091a] p-5 text-center"><div className="text-3xl">🔒</div><h2 className="mt-2 text-2xl font-black text-white">{text.title}</h2><p className="mt-2 text-sm text-slate-400">{text.locked}</p><a href="/subscription" className="mt-4 inline-flex rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-black text-white">{text.upgrade}</a></section>;
 if(!data)return null; const w=data.weather;
 return <section className="rounded-2xl border border-cyan-400/20 bg-[#040a18] p-4 sm:p-5"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[13px] font-black uppercase tracking-[.18em] text-cyan-400">PRO INTELLIGENCE</p><h2 className="mt-1 text-2xl font-black text-white">{text.title}</h2><p className="mt-1 text-[13px] text-slate-400">{text.subtitle}</p></div><span className="rounded-full border border-cyan-400/15 px-3 py-1.5 text-[13px] font-black text-cyan-300">AI CONTEXT</span></header>
  <div className="mt-4 grid gap-3 xl:grid-cols-2"><TeamCard team={data.home} locale={locale} labels={text}/><TeamCard team={data.away} locale={locale} labels={text}/></div>
  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4"><h3 className="text-lg font-black text-white">{text.weather}</h3>{w.available?<div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">{[[text.temperature,w.temperature!=null?`${w.temperature.toFixed(1)} °C`:"—"],[text.feelsLike,w.feels_like!=null?`${w.feels_like.toFixed(1)} °C`:"—"],[text.humidity,w.humidity!=null?`${w.humidity.toFixed(0)}%`:"—"],[text.wind,w.wind_speed!=null?`${w.wind_speed.toFixed(1)} m/s`:"—"],[text.attackImpact,percentage(w.attack_factor)],[text.fatigueImpact,percentage(w.fatigue_factor)]].map(([l,v])=><div key={l} className="rounded-xl border border-slate-800 bg-slate-900/35 px-3 py-2.5"><div className="text-[12px] font-bold text-slate-500">{l}</div><strong className="mt-1 block text-base font-black text-cyan-300" dir="ltr">{v}</strong></div>)}</div>:<p className="mt-2 text-sm text-slate-500">{text.noWeather}</p>}{w.description&&<p className="mt-2 text-sm text-slate-400">{translateWeather(w.description,locale)}</p>}</div>
  {data.warnings.length>0&&<div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[.025] p-4"><h3 className="text-base font-black text-amber-300">{text.warnings}</h3><ul className="mt-2 grid gap-2 md:grid-cols-2">{data.warnings.map((x,i)=><li key={`${x}-${i}`} className="text-[13px] leading-5 text-slate-300">• {translateWarning(x,locale)}</li>)}</ul></div>}
 </section>;
}
