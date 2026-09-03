type OddsSelection = { label: string | null; name: string | null; total: string | null; handicap: string | null; decimal_odds: number; bookmaker_name: string | null; };
type OddsMarket = { market_id: number; market_name: string; selections: OddsSelection[]; };
export type MatchOddsData = { match_id: number; fixture_id: number | null; markets_count: number; markets: OddsMarket[]; };

function selectionTitle(selection: OddsSelection): string {
  const parts = [selection.label || selection.name, selection.total ? "O/U " + selection.total : null, selection.handicap ? "HCP " + selection.handicap : null];
  return parts.filter(Boolean).join(" · ");
}

export default function MatchOdds({ data }: { data: MatchOddsData | null }) {
  if (!data || !data.markets.length) return null;
  return (
    <section className="rounded-2xl border border-emerald-400/15 bg-[#050b1e] p-3 sm:rounded-[28px] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-[13px] font-bold uppercase tracking-[0.16em] text-emerald-400 sm:tracking-[0.2em]">Market Odds</p><h2 className="mt-1 text-xl font-black text-white">Best Available Odds</h2></div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1.5 text-[13px] font-bold text-emerald-300">Pre-match</span>
      </div>
      <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-2">
        {data.markets.map((market) => (
          <div key={market.market_id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-black text-slate-100">{market.market_name}</h3><span className="text-[11px] font-bold text-slate-500">#{market.market_id}</span></div>
            <div className="grid grid-cols-2 gap-2">
              {market.selections.slice(0, market.market_id === 6 ? 8 : market.market_id === 67 || market.market_id === 80 ? 10 : 6).map((selection, index) => (
                <div key={market.market_id + "-" + selectionTitle(selection) + "-" + index} className="rounded-xl border border-white/[0.06] bg-[#020617] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3"><span className="min-w-0 break-words text-[13px] font-bold leading-4 text-slate-300">{selectionTitle(selection)}</span><strong className="shrink-0 text-lg font-black text-emerald-300">{Number(selection.decimal_odds).toFixed(2)}</strong></div>
                  <p className="mt-1 truncate text-[12px] text-slate-500">{selection.bookmaker_name || "Bookmaker"}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-5 text-slate-500">Odds may change. Displayed prices are the best available values stored for each market selection.</p>
    </section>
  );
}
