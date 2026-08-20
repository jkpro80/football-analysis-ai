"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

const liveMatches = [
  ["Liverpool", "2", "Arsenal", "1", "68'"],
  ["Inter", "1", "Milan", "1", "54'"],
];

const valueBets = [
  ["Over 2.5 Goals", "+18%", "2.05"],
  ["Home Win", "+14%", "1.92"],
  ["BTTS", "+11%", "1.88"],
];

export default function HomeHighlights() {
  const { locale } = useLocale();

  const t =
    locale === "ar"
      ? {
          liveEyebrow: "مباريات اليوم المباشرة",
          liveTitle: "المباريات المباشرة",
          viewAllLive: "مشاهدة الكل",
          valueEyebrow: "فرص القيمة",
          valueTitle: "أفضل فرص القيمة",
          viewAllValue: "عرض الكل",
          value: "القيمة",
          odds: "الأودز",
        }
      : locale === "sv"
        ? {
            liveEyebrow: "DAGENS LIVEMATCHER",
            liveTitle: "Livematcher",
            viewAllLive: "Visa alla",
            valueEyebrow: "VÄRDESPEL",
            valueTitle: "Bästa värdespelen",
            viewAllValue: "Visa alla",
            value: "Värde",
            odds: "Odds",
          }
        : {
            liveEyebrow: "TODAY'S LIVE MATCHES",
            liveTitle: "Live Matches",
            viewAllLive: "View All",
            valueEyebrow: "VALUE BETS",
            valueTitle: "Top Value Bets",
            viewAllValue: "View All",
            value: "Value",
            odds: "Odds",
          };

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="grid gap-6 xl:grid-cols-2"
    >
      <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-red-400">
              {t.liveEyebrow}
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              {t.liveTitle}
            </h2>
          </div>

          <Link
            href="/live"
            className="text-sm font-black text-red-300 hover:text-red-200"
          >
            {t.viewAllLive} {locale === "ar" ? "←" : "→"}
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {liveMatches.map(
            ([home, homeScore, away, awayScore, minute]) => (
              <article
                key={`${home}-${away}`}
                className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-800 bg-[#071023] p-4"
              >
                <span className="font-black text-white">
                  {home}
                </span>

                <strong
                  dir="ltr"
                  className="text-xl text-white"
                >
                  {homeScore} - {awayScore}
                </strong>

                <span
                  className={`font-black text-white ${
                    locale === "ar"
                      ? "text-left"
                      : "text-right"
                  }`}
                >
                  {away}
                </span>

                <span
                  dir="ltr"
                  className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-300"
                >
                  {minute}
                </span>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-emerald-400">
              {t.valueEyebrow}
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              {t.valueTitle}
            </h2>
          </div>

          <Link
            href="/value-bets"
            className="text-sm font-black text-emerald-300 hover:text-emerald-200"
          >
            {t.viewAllValue} {locale === "ar" ? "←" : "→"}
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {valueBets.map(([market, value, odds]) => (
            <article
              key={market}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-slate-800 bg-[#071023] p-4"
            >
              <span className="font-black text-white">
                {market}
              </span>

              <div className="text-center">
                <p className="text-[10px] text-slate-500">
                  {t.value}
                </p>

                <strong
                  dir="ltr"
                  className="text-emerald-400"
                >
                  {value}
                </strong>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-slate-500">
                  {t.odds}
                </p>

                <strong
                  dir="ltr"
                  className="text-amber-300"
                >
                  {odds}
                </strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
