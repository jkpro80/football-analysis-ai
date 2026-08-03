import Link from "next/link";

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
  return (
    <div dir="rtl" className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-red-400">
              TODAY&apos;S LIVE MATCHES
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              المباريات المباشرة
            </h2>
          </div>

          <Link
            href="/live"
            className="text-sm font-black text-red-300 hover:text-red-200"
          >
            مشاهدة الكل ←
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {liveMatches.map(
            ([home, homeScore, away, awayScore, minute]) => (
              <article
                key={`${home}-${away}`}
                className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-800 bg-[#071023] p-4"
              >
                <span className="font-black text-white">{home}</span>

                <strong className="text-xl text-white">
                  {homeScore} - {awayScore}
                </strong>

                <span className="text-left font-black text-white">
                  {away}
                </span>

                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-300">
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
              VALUE BETS
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              أفضل فرص القيمة
            </h2>
          </div>

          <Link
            href="/value-bets"
            className="text-sm font-black text-emerald-300 hover:text-emerald-200"
          >
            عرض الكل ←
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {valueBets.map(([market, value, odds]) => (
            <article
              key={market}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-2xl border border-slate-800 bg-[#071023] p-4"
            >
              <span className="font-black text-white">{market}</span>

              <div className="text-center">
                <p className="text-[10px] text-slate-500">Value</p>
                <strong className="text-emerald-400">{value}</strong>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-slate-500">Odds</p>
                <strong className="text-amber-300">{odds}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}