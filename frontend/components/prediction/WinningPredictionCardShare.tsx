"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

type Locale = "ar" | "en" | "sv";
type Item = {
  id: number;
  home_team?: string | null;
  away_team?: string | null;
  market: string;
  selection: string;
  line?: number | null;
  probability?: number | null;
};
type Card = {
  id: number;
  card_number: string;
  items_count: number;
  won_count: number;
  status: string;
  items: Item[];
};
type Props = { card: Card; locale: Locale };

export default function WinningPredictionCardShare({ card, locale }: Props) {
  const shareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (card.status !== "won") return null;

  const t = locale === "ar"
    ? {button:"شارك فوزك",sharing:"جارٍ إنشاء البطاقة...",winner:"بطاقة رابحة",correct:"توقعات صحيحة",copy:"نسخ الرابط",copied:"تم النسخ",home:"فوز المضيف",away:"فوز الضيف",draw:"تعادل",over:"أكثر من",under:"أقل من",yes:"نعم",no:"لا"}
    : locale === "sv"
      ? {button:"Dela vinsten",sharing:"Skapar kort...",winner:"Vinnande kort",correct:"rätta tips",copy:"Kopiera länk",copied:"Kopierad",home:"Hemmaseger",away:"Bortaseger",draw:"Oavgjort",over:"Över",under:"Under",yes:"Ja",no:"Nej"}
      : {button:"Share your win",sharing:"Creating card...",winner:"Winning Card",correct:"correct predictions",copy:"Copy link",copied:"Copied",home:"Home win",away:"Away win",draw:"Draw",over:"Over",under:"Under",yes:"Yes",no:"No"};

  const matchName = (item: Item) =>
    item.home_team && item.away_team ? `${item.home_team} vs ${item.away_team}` : "MÅLX";

  const pickLabel = (item: Item) => {
    const pick = item.selection.toLowerCase();
    if (item.market === "1x2") {
      if (pick === "home") return t.home;
      if (pick === "away") return t.away;
      if (pick === "draw") return t.draw;
    }
    if (pick === "over") return `${t.over}${item.line != null ? ` ${item.line}` : ""}`;
    if (pick === "under") return `${t.under}${item.line != null ? ` ${item.line}` : ""}`;
    if (pick === "yes") return t.yes;
    if (pick === "no") return t.no;
    return item.selection;
  };

  const probability = (value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const pct = value <= 1 ? value * 100 : value;
    return `${pct.toFixed(1).replace(/\.0$/, "")}%`;
  };

  const shareUrl = () =>
    typeof window === "undefined" ? "" : `${window.location.origin}/prediction-cards`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleShare() {
    const node = shareRef.current;
    if (!node || sharing) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#071b36",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `malx-winning-card-${card.card_number}.png`, {
        type: "image/png",
      });
      const title = `MÅLX — ${t.winner}`;
      const text = `🏆 MÅLX — ${t.winner}\n${card.won_count}/${card.items_count} ${t.correct}`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title, text, url: shareUrl() });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({ title, text, url: shareUrl() });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      await handleCopy();
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="fixed left-[-10000px] top-0 w-[720px]" aria-hidden="true">
        <div ref={shareRef} className="overflow-hidden rounded-[32px] border border-cyan-400/25 bg-[#071b36] p-8 text-white" dir={locale === "ar" ? "rtl" : "ltr"}>
          <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <div className="text-4xl font-black">MÅLX</div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-cyan-300">WINNING CARD</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-center">
              <div className="text-3xl">🏆</div>
              <div className="mt-1 text-sm font-black text-emerald-300">{t.winner}</div>
            </div>
          </div>

          <div className="py-7 text-center">
            <div className="text-6xl font-black text-emerald-300">{card.won_count}/{card.items_count}</div>
            <div className="mt-2 text-lg font-black">{t.correct} • 100%</div>
            <div className="mt-2 text-sm font-bold text-cyan-300">{card.card_number}</div>
          </div>

          <div className="space-y-3">
            {card.items.map((item, index) => {
              const pct = probability(item.probability);
              return (
                <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-lg font-black text-emerald-300">✓</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-black" dir="ltr">{index + 1}. {matchName(item)}</div>
                    <div className="mt-1 text-sm font-bold text-emerald-300">{pickLabel(item)}{pct ? ` • ${pct}` : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 border-t border-white/10 pt-5 text-center">
            <div className="text-sm font-black text-emerald-300">✓ VERIFIED WINNING CARD BY MÅLX</div>
            <div className="mt-2 text-xs font-bold tracking-[0.18em] text-white/55">MÅLX.COM</div>
          </div>
        </div>
      </div>

      <button type="button" onClick={() => void handleShare()} disabled={sharing} className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.1] px-3 py-1.5 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/[0.18] disabled:opacity-50">
        <span aria-hidden="true">🏆</span>{sharing ? t.sharing : t.button}
      </button>
      <button type="button" onClick={() => void handleCopy()} className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-white/65 transition hover:text-white">
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}
