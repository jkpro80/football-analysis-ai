"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

type PredictionCard = {
  id: number;
  league: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  xgHome: number;
  xgAway: number;
  btts: number;
  over25: number;
  bestPick: string;
  confidence: number;
};

const DEFAULT_PREDICTIONS: PredictionCard[] = [
  {
    id: 1,
    league: "La Liga",
    kickoff: "21:00",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeWin: 52,
    draw: 23,
    awayWin: 25,
    xgHome: 2.31,
    xgAway: 1.42,
    btts: 71,
    over25: 76,
    bestPick: "Over 2.5 Goals",
    confidence: 91,
  },
  {
    id: 2,
    league: "Premier League",
    kickoff: "19:30",
    homeTeam: "Liverpool",
    awayTeam: "Arsenal",
    homeWin: 46,
    draw: 28,
    awayWin: 26,
    xgHome: 1.98,
    xgAway: 1.36,
    btts: 68,
    over25: 72,
    bestPick: "BTTS",
    confidence: 87,
  },
  {
    id: 3,
    league: "Serie A",
    kickoff: "22:00",
    homeTeam: "Inter",
    awayTeam: "Milan",
    homeWin: 49,
    draw: 30,
    awayWin: 21,
    xgHome: 1.64,
    xgAway: 1.08,
    btts: 54,
    over25: 48,
    bestPick: "Inter Draw No Bet",
    confidence: 84,
  },
];

type TopPredictionsProps = {
  predictions?: PredictionCard[];
};

function getText(locale: Locale) {
  if (locale === "ar") {
    return {
      eyebrow: "أفضل توقعات الذكاء الاصطناعي",
      title: "أفضل توقعات الذكاء الاصطناعي",
      description:
        "أعلى المباريات من حيث الثقة وجودة البيانات.",
      viewAll: "عرض جميع التوقعات",
      today: "اليوم",
      homeWin: "فوز المضيف",
      draw: "التعادل",
      awayWin: "فوز الضيف",
      xgHome: "xG المضيف",
      xgAway: "xG الضيف",
      bestPick: "أفضل اختيار",
      confidence: "الثقة",
      analyzeMatch: "تحليل المباراة",
    };
  }

  if (locale === "sv") {
    return {
      eyebrow: "BÄSTA AI-PROGNOSER",
      title: "Bästa AI-prognoser",
      description:
        "Matcherna med högst säkerhet och datakvalitet.",
      viewAll: "Visa alla prognoser",
      today: "Idag",
      homeWin: "Hemmaseger",
      draw: "Oavgjort",
      awayWin: "Bortaseger",
      xgHome: "xG hemma",
      xgAway: "xG borta",
      bestPick: "Bästa val",
      confidence: "Säkerhet",
      analyzeMatch: "Analysera match",
    };
  }

  return {
    eyebrow: "TOP AI PREDICTIONS",
    title: "Top AI Predictions",
    description:
      "Matches with the highest confidence and data quality.",
    viewAll: "View All Predictions",
    today: "Today",
    homeWin: "Home Win",
    draw: "Draw",
    awayWin: "Away Win",
    xgHome: "Home xG",
    xgAway: "Away xG",
    bestPick: "Best Pick",
    confidence: "Confidence",
    analyzeMatch: "Analyze Match",
  };
}

function ProbabilityBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-slate-500">
          {label}
        </span>

        <span
          dir="ltr"
          className="font-black text-slate-300"
        >
          {value}%
        </span>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function TopPredictions({
  predictions = DEFAULT_PREDICTIONS,
}: TopPredictionsProps) {
  const {
    locale,
    direction,
  } = useLocale();

  const t = getText(locale);

  return (
    <section
      dir={direction}
      className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-cyan-400">
            {t.eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {t.title}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {t.description}
          </p>
        </div>

        <Link
          href="/predictions"
          className="text-sm font-black text-cyan-300 transition hover:text-cyan-200"
        >
          {t.viewAll} {direction === "rtl" ? "←" : "→"}
        </Link>
      </div>

      <div className="mt-5 space-y-4">
        {predictions.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-800 bg-[#071023] p-4 transition duration-300 hover:border-slate-700 sm:p-5"
          >
            <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr_0.8fr] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-800 px-3 py-1 font-bold text-slate-300">
                    {item.league}
                  </span>

                  <span className="text-slate-500">
                    {t.today} ·{" "}
                    <span dir="ltr">
                      {item.kickoff}
                    </span>
                  </span>
                </div>

                <div
                  dir="ltr"
                  className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                >
                  <div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-black text-cyan-300">
                      {item.homeTeam
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <p className="mt-2 font-black text-white">
                      {item.homeTeam}
                    </p>
                  </div>

                  <span className="text-sm font-black text-slate-600">
                    VS
                  </span>

                  <div className="text-left">
                    <div className="mr-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-700 bg-slate-900 text-sm font-black text-amber-300">
                      {item.awayTeam
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <p className="mt-2 font-black text-white">
                      {item.awayTeam}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                    <p className="text-[10px] text-slate-500">
                      {t.homeWin}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 font-black text-cyan-300"
                    >
                      {item.homeWin}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                    <p className="text-[10px] text-slate-500">
                      {t.draw}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 font-black text-slate-300"
                    >
                      {item.draw}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/80 p-3 text-center">
                    <p className="text-[10px] text-slate-500">
                      {t.awayWin}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 font-black text-amber-300"
                    >
                      {item.awayWin}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <ProbabilityBar
                  label="BTTS"
                  value={item.btts}
                />

                <ProbabilityBar
                  label="Over 2.5"
                  value={item.over25}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] text-slate-500">
                      {t.xgHome}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-lg font-black text-cyan-300"
                    >
                      {item.xgHome}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] text-slate-500">
                      {t.xgAway}
                    </p>

                    <p
                      dir="ltr"
                      className="mt-1 text-lg font-black text-amber-300"
                    >
                      {item.xgAway}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                <p className="text-xs font-bold text-slate-500">
                  {t.bestPick}
                </p>

                <p className="mt-2 text-lg font-black text-cyan-300">
                  {item.bestPick}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    {t.confidence}
                  </span>

                  <strong
                    dir="ltr"
                    className="text-2xl font-black text-emerald-400"
                  >
                    {item.confidence}%
                  </strong>
                </div>

                <Link
                  href={`/matches/${item.id}`}
                  className="mt-4 block rounded-xl bg-cyan-400 px-4 py-2.5 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  {t.analyzeMatch}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
