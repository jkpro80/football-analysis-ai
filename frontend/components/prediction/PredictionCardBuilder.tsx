"use client";

import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/config";
import {
  addPredictionCardItem,
  createPredictionCard,
  getPredictionCards,
  type PredictionCard,
  type PredictionCardItem,
} from "@/lib/prediction-cards-api";

type Market =
  | "1x2"
  | "goals_2_5"
  | "btts"
  | "corners_total"
  | "corners_home"
  | "corners_away";

type Selection =
  | "home"
  | "draw"
  | "away"
  | "over"
  | "under"
  | "yes"
  | "no";

type Props = {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  locale: Locale;
};

const TOTAL_CORNER_LINES = [
  7.5,
  8.5,
  9.5,
  10.5,
  11.5,
] as const;

const TEAM_CORNER_LINES = [
  1.5,
  2.5,
  3.5,
  4.5,
  5.5,
  6.5,
  7.5,
] as const;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}

export default function PredictionCardBuilder({
  matchId,
  homeTeamName,
  awayTeamName,
  locale,
}: Props) {
  const text =
    locale === "sv"
      ? {
          title: "Bygg din prognoskupong",
          subtitle:
            "Välj marknad och låt modellen beräkna sannolikheten.",
          card: "Kupong",
          newCard: "Ny kupong",
          creating: "Skapar...",
          market: "Marknad",
          selection: "Val",
          line: "Linje",
          add: "Lägg till i kupongen",
          adding: "Lägger till...",
          result: "Modellresultat",
          probability: "Sannolikhet",
          expected: "Förväntat värde",
          confidence: "Konfidens",
          loadFailed: "Kunde inte ladda kuponger.",
          createFailed: "Kunde inte skapa kupongen.",
          addFailed: "Kunde inte lägga till valet.",
          added: "Valet har lagts till.",
          noCards: "Ingen kupong ännu",
          resultMarket: "Matchresultat",
          goals: "Mål över/under 2.5",
          btts: "Båda lagen gör mål",
          totalCorners: "Totala hörnor",
          homeCorners: `${homeTeamName} hörnor`,
          awayCorners: `${awayTeamName} hörnor`,
          homeWin: `${homeTeamName} vinner`,
          draw: "Oavgjort",
          awayWin: `${awayTeamName} vinner`,
          over: "Över",
          under: "Under",
          yes: "Ja",
          no: "Nej",
        }
      : locale === "en"
        ? {
            title: "Build Your Prediction Card",
            subtitle:
              "Choose a market and let the model calculate the probability.",
            card: "Card",
            newCard: "New Card",
            creating: "Creating...",
            market: "Market",
            selection: "Selection",
            line: "Line",
            add: "Add to Card",
            adding: "Adding...",
            result: "Model Result",
            probability: "Probability",
            expected: "Expected Value",
            confidence: "Confidence",
            loadFailed: "Unable to load prediction cards.",
            createFailed: "Unable to create prediction card.",
            addFailed: "Unable to add selection.",
            added: "Selection added to the card.",
            noCards: "No card yet",
            resultMarket: "Match Result",
            goals: "Goals Over/Under 2.5",
            btts: "Both Teams to Score",
            totalCorners: "Total Corners",
            homeCorners: `${homeTeamName} Corners`,
            awayCorners: `${awayTeamName} Corners`,
            homeWin: `${homeTeamName} Win`,
            draw: "Draw",
            awayWin: `${awayTeamName} Win`,
            over: "Over",
            under: "Under",
            yes: "Yes",
            no: "No",
          }
        : {
            title: "أنشئ بطاقة توقعاتك",
            subtitle:
              "اختر السوق واترك للمحرك حساب دقة التوقع.",
            card: "البطاقة",
            newCard: "بطاقة جديدة",
            creating: "جارٍ الإنشاء...",
            market: "السوق",
            selection: "الاختيار",
            line: "الخط",
            add: "إضافة إلى البطاقة",
            adding: "جارٍ الإضافة...",
            result: "نتيجة المحرك",
            probability: "دقة التوقع",
            expected: "القيمة المتوقعة",
            confidence: "الثقة",
            loadFailed: "تعذر تحميل البطاقات.",
            createFailed: "تعذر إنشاء البطاقة.",
            addFailed: "تعذر إضافة الاختيار.",
            added: "تمت إضافة الاختيار إلى البطاقة.",
            noCards: "لا توجد بطاقة بعد",
            resultMarket: "نتيجة المباراة",
            goals: "الأهداف أكثر/أقل من 2.5",
            btts: "تسجيل الفريقين",
            totalCorners: "إجمالي الركنيات",
            homeCorners: `ركنيات ${homeTeamName}`,
            awayCorners: `ركنيات ${awayTeamName}`,
            homeWin: `فوز ${homeTeamName}`,
            draw: "تعادل",
            awayWin: `فوز ${awayTeamName}`,
            over: "أكثر من",
            under: "أقل من",
            yes: "نعم",
            no: "لا",
          };

  const [cards, setCards] = useState<PredictionCard[]>([]);
  const [cardId, setCardId] = useState<number | null>(null);

  const [market, setMarket] =
    useState<Market>("1x2");

  const [selection, setSelection] =
    useState<Selection>("home");

  const [line, setLine] = useState<number | null>(null);

  const [loadingCards, setLoadingCards] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lastItem, setLastItem] =
    useState<PredictionCardItem | null>(null);

  const requiresLine =
    market === "corners_total" ||
    market === "corners_home" ||
    market === "corners_away";

  const availableLines = useMemo(() => {
    if (market === "corners_total") {
      return [...TOTAL_CORNER_LINES];
    }

    if (
      market === "corners_home" ||
      market === "corners_away"
    ) {
      return [...TEAM_CORNER_LINES];
    }

    return [];
  }, [market]);

  useEffect(() => {
    let active = true;

    async function loadCards() {
      try {
        const result = await getPredictionCards();

        if (!active) return;

        setCards(result);

        if (result.length > 0) {
          setCardId(result[0].id);
        }
      } catch (loadError) {
        if (!active) return;

        setError(
          `${text.loadFailed} ${errorMessage(loadError)}`,
        );
      } finally {
        if (active) {
          setLoadingCards(false);
        }
      }
    }

    void loadCards();

    return () => {
      active = false;
    };
  }, [text.loadFailed]);

  useEffect(() => {
    setLastItem(null);
    setMessage(null);
    setError(null);

    if (market === "1x2") {
      setSelection("home");
      setLine(null);
      return;
    }

    if (market === "btts") {
      setSelection("yes");
      setLine(null);
      return;
    }

    if (market === "goals_2_5") {
      setSelection("over");
      setLine(null);
      return;
    }

    setSelection("over");

    if (market === "corners_total") {
      setLine(9.5);
    } else {
      setLine(4.5);
    }
  }, [market]);

  const selectionOptions = useMemo(() => {
    if (market === "1x2") {
      return [
        {
          value: "home" as const,
          label: text.homeWin,
        },
        {
          value: "draw" as const,
          label: text.draw,
        },
        {
          value: "away" as const,
          label: text.awayWin,
        },
      ];
    }

    if (market === "btts") {
      return [
        {
          value: "yes" as const,
          label: text.yes,
        },
        {
          value: "no" as const,
          label: text.no,
        },
      ];
    }

    return [
      {
        value: "over" as const,
        label: text.over,
      },
      {
        value: "under" as const,
        label: text.under,
      },
    ];
  }, [
    market,
    text.awayWin,
    text.draw,
    text.homeWin,
    text.no,
    text.over,
    text.under,
    text.yes,
  ]);

  async function handleCreateCard() {
    setCreating(true);
    setError(null);
    setMessage(null);

    try {
      const card = await createPredictionCard();

      setCards((current) => [card, ...current]);
      setCardId(card.id);
      setLastItem(null);
    } catch (createError) {
      setError(
        `${text.createFailed} ${errorMessage(createError)}`,
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleAdd() {
    if (!cardId) {
      setError(text.noCards);
      return;
    }

    if (requiresLine && line == null) {
      setError(`${text.line} is required.`);
      return;
    }

    setAdding(true);
    setError(null);
    setMessage(null);
    setLastItem(null);

    try {
      const item = await addPredictionCardItem(
        cardId,
        {
          match_id: matchId,
          market,
          selection,
          line: requiresLine ? line : null,
        },
      );

      setLastItem(item);
      setMessage(text.added);

      setCards((current) =>
        current.map((card) =>
          card.id === cardId
            ? {
                ...card,
                items_count: card.items_count + 1,
                items: [...card.items, item],
              }
            : card,
        ),
      );
    } catch (addError) {
      setError(
        `${text.addFailed} ${errorMessage(addError)}`,
      );
    } finally {
      setAdding(false);
    }
  }

  const percentage = (value: number | null) =>
    value == null
      ? "—"
      : `${(Number(value) * 100).toFixed(2)}%`;

  return (
    <section className="rounded-[32px] border border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 via-[#11161C] to-[#11161C]/20 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
            Målx
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {text.title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
            {text.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateCard}
          disabled={creating}
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-black text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? text.creating : `+ ${text.newCard}`}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-white/65">
            {text.card}
          </span>

          <select
            value={cardId ?? ""}
            disabled={loadingCards || cards.length === 0}
            onChange={(event) =>
              setCardId(
                event.target.value
                  ? Number(event.target.value)
                  : null,
              )
            }
            className="w-full rounded-xl border border-white/10 bg-[#080A0D] px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/50"
          >
            {cards.length === 0 ? (
              <option value="">
                {loadingCards ? "..." : text.noCards}
              </option>
            ) : (
              cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.card_number}
                  {card.title ? ` — ${card.title}` : ""}
                  {` (${card.items_count})`}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-white/65">
            {text.market}
          </span>

          <select
            value={market}
            onChange={(event) =>
              setMarket(event.target.value as Market)
            }
            className="w-full rounded-xl border border-white/10 bg-[#080A0D] px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/50"
          >
            <option value="1x2">
              {text.resultMarket}
            </option>

            <option value="goals_2_5">
              {text.goals}
            </option>

            <option value="btts">
              {text.btts}
            </option>

            <option value="corners_total">
              {text.totalCorners}
            </option>

            <option value="corners_home">
              {text.homeCorners}
            </option>

            <option value="corners_away">
              {text.awayCorners}
            </option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-white/65">
            {text.selection}
          </span>

          <select
            value={selection}
            onChange={(event) =>
              setSelection(
                event.target.value as Selection,
              )
            }
            className="w-full rounded-xl border border-white/10 bg-[#080A0D] px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/50"
          >
            {selectionOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {requiresLine && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-white/65">
              {text.line}
            </span>

            <select
              value={line ?? ""}
              onChange={(event) =>
                setLine(Number(event.target.value))
              }
              className="w-full rounded-xl border border-white/10 bg-[#080A0D] px-3 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/50"
            >
              {availableLines.map((value) => (
                <option key={value} value={value}>
                  {value.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={adding || !cardId}
        className="mt-5 w-full rounded-2xl bg-cyan-400 px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {adding ? text.adding : text.add}
      </button>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300">
          {error}
        </div>
      )}

      {lastItem && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm font-black text-white">
            {text.result}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <span className="text-xs text-white/50">
                {text.probability}
              </span>

              <strong className="mt-1 block text-xl text-cyan-300">
                {percentage(lastItem.probability)}
              </strong>
            </div>

            <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <span className="text-xs text-white/50">
                {text.expected}
              </span>

              <strong className="mt-1 block text-xl text-cyan-300">
                {lastItem.expected_value == null
                  ? "—"
                  : Number(
                      lastItem.expected_value,
                    ).toFixed(2)}
              </strong>
            </div>

            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
              <span className="text-xs text-white/50">
                {text.confidence}
              </span>

              <strong className="mt-1 block text-xl text-emerald-300">
                {percentage(lastItem.confidence)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
