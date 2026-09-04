"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

type Locale = "ar" | "en" | "sv";

type Evaluation = {
  available?: boolean;
  winner_correct?: boolean | null;
  exact_score_correct?: boolean | null;
  actual_score?: {
    home?: number;
    away?: number;
    total?: number;
  } | null;
  btts?: {
    predicted?: boolean;
    actual?: boolean;
    correct?: boolean;
  };
  over_2_5?: {
    predicted?: boolean;
    actual?: boolean;
    correct?: boolean;
  };
  corners?: {
    available?: boolean;
    actual_total?: number | null;
    expected_min?: number | null;
    expected_max?: number | null;
    correct?: boolean | null;
  };
  yellow_cards?: {
    available?: boolean;
    actual_total?: number | null;
    expected_min?: number | null;
    expected_max?: number | null;
    correct?: boolean | null;
  };
};

type EventForecast = {
  total_expected?: number | null;
  over_probabilities?: Record<string, number>;
  most_likely_range?: {
    minimum: number;
    maximum: number;
  };
} | null;

type MatchShareCardProps = {
  matchId: number | string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  mostLikelyScore?: string | null;
  scoreProbability?: number | null;

  homeWin?: number | null;
  draw?: number | null;
  awayWin?: number | null;

  over25?: number | null;
  under25?: number | null;
  bttsYes?: number | null;
  bttsNo?: number | null;

  cornersForecast?: EventForecast;
  yellowCardsForecast?: EventForecast;

  homeExpectedGoals?: number | null;
  awayExpectedGoals?: number | null;

  isFinished?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  evaluation?: Evaluation;

  locale: Locale;
};

const formatProbability = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(1).replace(/\.0$/, "")}%`;
};

const formatNumber = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2).replace(/\.00$/, "")
    : "—";

const bestOverUnder = (
  over?: number | null,
  under?: number | null,
  line = "2.5",
) => {
  const o = typeof over === "number" ? over : -1;
  const u = typeof under === "number" ? under : -1;

  return o >= u
    ? { side: "over" as const, line, probability: over }
    : { side: "under" as const, line, probability: under };
};

const bestEventLine = (forecast?: EventForecast) => {
  const entries = Object.entries(forecast?.over_probabilities ?? {});

  if (!entries.length) return null;

  const candidates = entries
    .map(([key, value]) => {
      const line = key
        .replace(/^over_/, "")
        .replaceAll("_", ".");

      const probability = Number(value);

      if (!Number.isFinite(probability)) return null;

      const normalized = probability <= 1 ? probability * 100 : probability;
      const over = normalized;
      const under = 100 - normalized;

      return over >= under
        ? { side: "over" as const, line, probability: over }
        : { side: "under" as const, line, probability: under };
    })
    .filter(Boolean) as Array<{
      side: "over" | "under";
      line: string;
      probability: number;
    }>;

  if (!candidates.length) return null;

  return candidates.sort(
    (a, b) => b.probability - a.probability,
  )[0];
};

export default function MatchShareCard({
  matchId,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  mostLikelyScore,
  scoreProbability,
  homeWin,
  draw,
  awayWin,
  over25,
  under25,
  bttsYes,
  bttsNo,
  cornersForecast,
  yellowCardsForecast,
  homeExpectedGoals,
  awayExpectedGoals,
  isFinished = false,
  homeScore,
  awayScore,
  evaluation,
  locale,
}: MatchShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const labels = {
    ar: {
      title: "بطاقة توقعات Målx",
      subtitle: "6 توقعات رئيسية للمباراة",
      share: "مشاركة البطاقة",
      copy: "نسخ الرابط",
      copied: "تم النسخ",
      result: "نتيجة المباراة",
      exact: "النتيجة الدقيقة",
      goals: "الأهداف",
      btts: "الفريقين يسجل",
      corners: "الركنيات",
      cards: "البطاقات",
      home: "فوز المضيف",
      draw: "تعادل",
      away: "فوز الضيف",
      over: "أكثر من",
      under: "أقل من",
      yes: "نعم",
      no: "لا",
      probability: "الاحتمال",
      final: "النتيجة النهائية",
      actual: "الفعلي",
      correct: "صحيح",
      wrong: "غير صحيح",
      predictions: "توقعات MÅLX",
      xg: "الأهداف المتوقعة",
    },
    en: {
      title: "Målx Prediction Card",
      subtitle: "6 key match predictions",
      share: "Share Card",
      copy: "Copy Link",
      copied: "Copied",
      result: "Match Result",
      exact: "Exact Score",
      goals: "Goals",
      btts: "Both Teams Score",
      corners: "Corners",
      cards: "Yellow Cards",
      home: "Home Win",
      draw: "Draw",
      away: "Away Win",
      over: "Over",
      under: "Under",
      yes: "Yes",
      no: "No",
      probability: "Probability",
      final: "Final Score",
      actual: "Actual",
      correct: "Correct",
      wrong: "Wrong",
      predictions: "MÅLX Predictions",
      xg: "Expected Goals",
    },
    sv: {
      title: "Målx Prognoskort",
      subtitle: "6 viktiga matchprognoser",
      share: "Dela kort",
      copy: "Kopiera länk",
      copied: "Kopierad",
      result: "Matchresultat",
      exact: "Exakt resultat",
      goals: "Mål",
      btts: "Båda lagen gör mål",
      corners: "Hörnor",
      cards: "Gula kort",
      home: "Hemmaseger",
      draw: "Oavgjort",
      away: "Bortaseger",
      over: "Över",
      under: "Under",
      yes: "Ja",
      no: "Nej",
      probability: "Sannolikhet",
      final: "Slutresultat",
      actual: "Faktiskt",
      correct: "Rätt",
      wrong: "Fel",
      predictions: "MÅLX Prognoser",
      xg: "Förväntade mål",
    },
  } as const;

  const t = labels[locale] ?? labels.en;

  const resultOptions = [
    { key: "home", label: t.home, value: homeWin },
    { key: "draw", label: t.draw, value: draw },
    { key: "away", label: t.away, value: awayWin },
  ];

  const predictedResult = [...resultOptions].sort(
    (a, b) => (b.value ?? -1) - (a.value ?? -1),
  )[0];

  const goalsPick = bestOverUnder(over25, under25);

  const bttsPick =
    (bttsYes ?? -1) >= (bttsNo ?? -1)
      ? { label: t.yes, probability: bttsYes }
      : { label: t.no, probability: bttsNo };

  const cornersPick = bestEventLine(cornersForecast);
  const cardsPick = bestEventLine(yellowCardsForecast);

  const status = (correct?: boolean | null) => {
    if (!isFinished || typeof correct !== "boolean") return null;

    return correct
      ? {
          icon: "✓",
          text: t.correct,
          cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        }
      : {
          icon: "✕",
          text: t.wrong,
          cls: "border-rose-400/20 bg-rose-400/10 text-rose-300",
        };
  };

  const cards = [
    {
      key: "result",
      icon: "1X2",
      title: t.result,
      value: predictedResult?.label ?? "—",
      probability: formatProbability(predictedResult?.value),
      probabilityValue: predictedResult?.value,
      status: status(evaluation?.winner_correct),
    },
    {
      key: "goals",
      icon: "O/U",
      title: t.goals,
      value: `${goalsPick.side === "over" ? t.over : t.under} ${goalsPick.line}`,
      probability: formatProbability(goalsPick.probability),
      probabilityValue: goalsPick.probability,
      status: status(evaluation?.over_2_5?.correct),
    },
    {
      key: "btts",
      icon: "BTTS",
      title: t.btts,
      value: bttsPick.label,
      probability: formatProbability(bttsPick.probability),
      probabilityValue: bttsPick.probability,
      status: status(evaluation?.btts?.correct),
    },
    {
      key: "score",
      icon: "#",
      title: t.exact,
      value: mostLikelyScore ?? "—",
      probability: formatProbability(scoreProbability),
      probabilityValue: scoreProbability,
      status: status(evaluation?.exact_score_correct),
    },
    {
      key: "corners",
      icon: "⌑",
      title: t.corners,
      value: cornersPick
        ? `${cornersPick.side === "over" ? t.over : t.under} ${cornersPick.line}`
        : cornersForecast?.most_likely_range
          ? `${cornersForecast.most_likely_range.minimum}–${cornersForecast.most_likely_range.maximum}`
          : "—",
      probability: cornersPick
        ? formatProbability(cornersPick.probability)
        : formatNumber(cornersForecast?.total_expected),
      probabilityValue: cornersPick?.probability,
      status: status(evaluation?.corners?.correct),
    },
    {
      key: "cards",
      icon: "▰",
      title: t.cards,
      value: cardsPick
        ? `${cardsPick.side === "over" ? t.over : t.under} ${cardsPick.line}`
        : yellowCardsForecast?.most_likely_range
          ? `${yellowCardsForecast.most_likely_range.minimum}–${yellowCardsForecast.most_likely_range.maximum}`
          : "—",
      probability: cardsPick
        ? formatProbability(cardsPick.probability)
        : formatNumber(yellowCardsForecast?.total_expected),
      probabilityValue: cardsPick?.probability,
      status: status(evaluation?.yellow_cards?.correct),
    },
  ];

  const confidenceTone = (value?: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return {
        text: "text-slate-300",
        border: "border-white/[0.10]",
        bg: "bg-[#0b2342]",
        icon: "border-slate-400/25 bg-slate-400/[0.08] text-slate-300",
        bar: "bg-slate-400",
        glow: "",
      };
    }

    const pct = value <= 1 ? value * 100 : value;

    if (pct >= 70) {
      return {
        text: "text-emerald-300",
        border: "border-emerald-400/30",
        bg: "bg-emerald-400/[0.055]",
        icon: "border-emerald-400/35 bg-emerald-400/[0.10] text-emerald-300",
        bar: "bg-emerald-400",
        glow: "shadow-[0_0_20px_rgba(52,211,153,0.07)]",
      };
    }

    if (pct >= 55) {
      return {
        text: "text-amber-300",
        border: "border-amber-300/30",
        bg: "bg-amber-300/[0.05]",
        icon: "border-amber-300/35 bg-amber-300/[0.10] text-amber-300",
        bar: "bg-amber-300",
        glow: "shadow-[0_0_20px_rgba(252,211,77,0.06)]",
      };
    }

    return {
      text: "text-rose-300",
      border: "border-rose-400/30",
      bg: "bg-rose-400/[0.05]",
      icon: "border-rose-400/35 bg-rose-400/[0.10] text-rose-300",
      bar: "bg-rose-400",
      glow: "shadow-[0_0_20px_rgba(251,113,133,0.06)]",
    };
  };

  const finalScore =
    isFinished &&
    typeof homeScore === "number" &&
    typeof awayScore === "number"
      ? `${homeScore}-${awayScore}`
      : null;

  const buildShareText = () => {
    const lines = [
      "MÅLX ⚽",
      `${homeTeam} vs ${awayTeam}`,
    ];

    if (finalScore) {
      lines.push(`${t.final}: ${finalScore}`);
    }

    lines.push("");
    lines.push(t.predictions);

    cards.forEach((item) => {
      lines.push(
        `${item.status?.icon ?? "•"} ${item.title}: ${item.value} (${item.probability})`,
      );
    });

    if (
      typeof homeExpectedGoals === "number" &&
      typeof awayExpectedGoals === "number"
    ) {
      lines.push("");
      lines.push(
        `xG: ${formatNumber(homeExpectedGoals)} - ${formatNumber(awayExpectedGoals)}`,
      );
    }

    return lines.join("\n");
  };

  const getShareUrl = () =>
    `${window.location.origin}/matches/${encodeURIComponent(String(matchId))}`;

  const handleShare = async () => {
    const url = getShareUrl();
    const node = shareCardRef.current;

    if (!node || sharing) return;

    setSharing(true);

    try {
      const dataUrl = await toPng(node, {
        width: node.scrollWidth,
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#071b36",
        filter: (element) =>
          !(element instanceof HTMLElement) ||
          element.dataset.shareControls !== "true",
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const file = new File(
        [blob],
        `malx-${String(matchId)}.png`,
        { type: "image/png" },
      );

      const shareData = {
        title: `MÅLX | ${homeTeam} vs ${awayTeam}`,
        text: buildShareText(),
        url,
        files: [file],
      };

      if (
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url,
          });
          return;
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }
        }
      }

      await navigator.clipboard.writeText(
        `${buildShareText()}\n${url}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      console.error("MÅLX share card generation failed:", error);

      await navigator.clipboard.writeText(
        `${buildShareText()}\n${url}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${buildShareText()}\n${getShareUrl()}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <section
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="relative h-fit min-h-0 overflow-hidden rounded-[28px] border border-blue-300/35 bg-[#071b36] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[220px] bg-gradient-to-b from-blue-400/[0.16] to-transparent" />
          <div className="absolute -left-24 top-40 h-64 w-64 rounded-full bg-blue-400/[0.10] blur-3xl" />
          <div className="absolute -right-24 bottom-28 h-64 w-64 rounded-full bg-cyan-300/[0.08] blur-3xl" />
        </div>

        <div
          ref={shareCardRef}
          className="relative h-fit min-h-0 px-4 pb-2 pt-4 sm:px-5"
        >

          {/* Header */}
          <header className="relative mb-3 text-center">
            <div
              dir="ltr"
              className="text-[32px] font-black tracking-[0.24em] text-white sm:text-[38px]"
            >
              MÅLX
            </div>

            <div className="mx-auto mt-1 h-px w-28 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />

            <p className="mt-2 text-[11px] font-bold text-cyan-300 sm:text-xs">
              {locale === "ar"
                ? "تحليل وتوقعات المباريات بالذكاء الاصطناعي"
                : locale === "sv"
                  ? "AI-driven matchanalys och prognoser"
                  : "AI-powered match analysis & predictions"}
            </p>

            <div className="absolute left-0 top-0 rounded-xl border border-cyan-300/30 bg-cyan-300/[0.07] px-2.5 py-1.5 text-[9px] font-black text-cyan-200">
              PREMIUM AI
            </div>
          </header>

          {/* Match Hero */}
          <div className="rounded-[22px] border border-white/[0.09] bg-[#0b2748]/95 px-3 py-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">

              {/* Home */}
              <div className="flex min-w-0 flex-col items-center text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-white/[0.08] bg-black/25 p-2">
                  {homeLogo ? (
                    <img
                      src={homeLogo}
                      alt={homeTeam}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-500">H</span>
                  )}
                </div>

                <div className="mt-2 flex min-h-[34px] max-w-[180px] items-center justify-center">
                  <span className="text-center text-[13px] font-black leading-tight text-white sm:text-sm">
                    {homeTeam}
                  </span>
                </div>
              </div>

              {/* Center score */}
              <div className="flex min-w-[118px] flex-col items-center">
                <div className="text-[9px] font-black text-slate-500">
                  {finalScore ? t.final : t.exact}
                </div>

                <div
                  dir="ltr"
                  className={[
                    "mt-1.5 min-w-[112px] rounded-2xl border px-4 py-2 text-center text-[30px] font-black tracking-wide text-white",
                    finalScore
                      ? "border-emerald-300/35 bg-emerald-300/[0.08]"
                      : "border-cyan-300/35 bg-cyan-300/[0.08]",
                  ].join(" ")}
                >
                  {finalScore ?? mostLikelyScore ?? "—"}
                </div>

                {!finalScore ? (
                  <div
                    dir="ltr"
                    className="mt-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-2 py-0.5 text-[10px] font-black text-cyan-300"
                  >
                    {formatProbability(scoreProbability)}
                  </div>
                ) : (
                  <div className="mt-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-2 py-0.5 text-[9px] font-black text-emerald-300">
                    {locale === "ar"
                      ? "انتهت المباراة"
                      : locale === "sv"
                        ? "Matchen avslutad"
                        : "Match finished"}
                  </div>
                )}
              </div>

              {/* Away */}
              <div className="flex min-w-0 flex-col items-center text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-white/[0.08] bg-black/25 p-2">
                  {awayLogo ? (
                    <img
                      src={awayLogo}
                      alt={awayTeam}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-500">A</span>
                  )}
                </div>

                <div className="mt-2 flex min-h-[34px] max-w-[180px] items-center justify-center">
                  <span className="text-center text-[13px] font-black leading-tight text-white sm:text-sm">
                    {awayTeam}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 1X2 */}
          <section className="mt-3 overflow-hidden rounded-[20px] border border-cyan-300/25 bg-[#0a2342]/95">
            <div className="border-b border-white/[0.06] px-3 py-2 text-center text-[11px] font-black text-cyan-300">
              {locale === "ar"
                ? "توقع نتيجة المباراة – 1X2"
                : locale === "sv"
                  ? "Matchresultat – 1X2"
                  : "Match Result – 1X2"}
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/[0.08]" dir="ltr">
              {resultOptions.map((option) => {
                const active = option.key === predictedResult?.key;
                const isDraw = option.key === "draw";

                const optionTone = active
                  ? "bg-emerald-400/[0.10]"
                  : isDraw
                    ? "bg-amber-300/[0.07]"
                    : "bg-rose-400/[0.07]";

                const optionText = active
                  ? "text-emerald-300"
                  : isDraw
                    ? "text-amber-300"
                    : "text-rose-300";

                const optionBar = active
                  ? "bg-emerald-400"
                  : isDraw
                    ? "bg-amber-300"
                    : "bg-rose-400";

                const rawProbability =
                  typeof option.value === "number"
                    ? option.value <= 1
                      ? option.value * 100
                      : option.value
                    : 0;

                return (
                  <div
                    key={option.key}
                    className={[
                      "px-2 py-2.5 text-center",
                      optionTone,
                      active
                        ? "ring-1 ring-inset ring-emerald-400/30"
                        : "",
                    ].join(" ")}
                  >
                    <div className="text-[9px] font-bold text-slate-300">
                      {option.label}
                    </div>

                    <div
                      className={[
                        "mt-1 text-[20px] font-black",
                        optionText,
                      ].join(" ")}
                    >
                      {formatProbability(option.value)}
                    </div>

                    <div className="mx-auto mt-1.5 h-[4px] w-[72%] overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className={[
                          "h-full rounded-full",
                          optionBar,
                        ].join(" ")}
                        style={{
                          width: `${Math.max(
                            4,
                            Math.min(100, rawProbability),
                          )}%`,
                        }}
                      />
                    </div>

                    {active ? (
                      <div className="mt-1 text-[8px] font-black text-emerald-300">
                        ● MÅLX PICK
                      </div>
                    ) : (
                      <div className="mt-1 h-[10px]" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Six Predictions */}
          <section className="mt-3 rounded-[20px] border border-cyan-300/25 bg-[#0a2342]/95 p-2.5">
            <div className="mb-2 text-center text-[11px] font-black text-cyan-300">
              {t.predictions}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {cards.map((item) => {
                const tone = confidenceTone(item.probabilityValue);
                const raw =
                  typeof item.probabilityValue === "number"
                    ? item.probabilityValue <= 1
                      ? item.probabilityValue * 100
                      : item.probabilityValue
                    : 0;

                return (
                <article
                  key={item.key}
                  className={[
                    "relative flex min-h-[112px] flex-col overflow-hidden rounded-[15px] border p-2.5",
                    "bg-[#0c294d]",
                    tone.border,
                    tone.bg,
                    tone.glow,
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-[9px] font-bold leading-tight text-slate-300">
                      {item.title}
                    </div>

                    <span
                      dir="ltr"
                      className={[
                        "rounded-lg border px-1.5 py-1 text-[8px] font-black",
                        tone.icon,
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                  </div>

                  <div className="mt-2 flex-1">
                    <div className="text-[13px] font-black leading-tight text-white">
                      {item.value}
                    </div>

                    <div
                      dir="ltr"
                      className={[
                        "mt-1 text-[13px] font-black",
                        tone.text,
                      ].join(" ")}
                    >
                      {item.probability}
                    </div>
                  </div>

                  {item.status ? (
                    <div
                      className={[
                        "mt-2 rounded-lg border px-1.5 py-1 text-center text-[8px] font-black",
                        item.status.cls,
                      ].join(" ")}
                    >
                      {item.status.icon} {item.status.text}
                    </div>
                  ) : (
                    <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className={["h-full rounded-full", tone.bar].join(" ")}
                        style={{
                          width: `${Math.max(4, Math.min(100, raw))}%`,
                        }}
                      />
                    </div>
                  )}
                </article>
                );
              })}
            </div>
          </section>

          {/* xG */}
          <section className="mt-3 rounded-[18px] border border-cyan-300/25 bg-[#0a2342]/95 px-3 py-2.5">
            <div className="mb-2 text-center text-[10px] font-black text-cyan-300">
              {locale === "ar"
                ? "الأهداف المتوقعة (xG)"
                : locale === "sv"
                  ? "Förväntade mål (xG)"
                  : "Expected Goals (xG)"}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3" dir="ltr">
              <div>
                <div className="truncate text-[9px] font-bold text-slate-300">
                  {homeTeam}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[18px] font-black text-emerald-300">
                    {formatNumber(homeExpectedGoals)}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-emerald-300" />
                  </div>
                </div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-xs font-black text-white">
                xG
              </div>

              <div>
                <div className="truncate text-[9px] font-bold text-slate-300">
                  {awayTeam}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[18px] font-black text-cyan-300">
                    {formatNumber(awayExpectedGoals)}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-cyan-300" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
            <div>
              <div className="text-[11px] font-black text-cyan-300">
                {locale === "ar"
                  ? "شارك توقعاتك وتحدَّ أصدقاءك!"
                  : locale === "sv"
                    ? "Dela dina prognoser!"
                    : "Share your predictions!"}
              </div>

              <div className="mt-0.5 text-[8px] font-bold text-slate-500">
                AI FOOTBALL INTELLIGENCE • MÅLX MODEL
              </div>
            </div>

            <div className="text-left" dir="ltr">
              <div className="text-[19px] font-black tracking-[0.18em] text-white">
                MÅLX
              </div>
              <div className="text-[9px] font-black text-cyan-300">
                målx.com
              </div>
            </div>
          </footer>

        </div>
      </section>

      {/* Share controls are outside the PNG capture area */}
      <div className="mt-4 flex gap-2 border-t border-cyan-300/10 pt-4">
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 rounded-xl border border-cyan-300/30 bg-cyan-300/[0.10] px-4 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-300/[0.15] disabled:cursor-wait disabled:opacity-70"
        >
          {sharing ? "⏳" : "↗"} {t.share}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07]"
        >
          {copied ? `✓ ${t.copied}` : `🔗 ${t.copy}`}
        </button>
      </div>
    </div>
  );
}
