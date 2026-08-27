"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import {
  getStrongPicks,
  type StrongPick,
  type StrongPicksResponse,
} from "@/lib/strong-picks-api";

const COUNTS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function percentage(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export default function PremiumStrongPicks() {
  const { user } = useAuth();
  const { locale } = useLocale();

  const [count, setCount] = useState(5);
  const [card, setCard] =
    useState<StrongPicksResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planCode =
    user?.subscription?.plan?.code?.toLowerCase() ?? null;

  const hasPremiumAccess =
    user?.role === "admin" ||
    planCode === "premium";

  const t =
    locale === "ar"
      ? {
          eyebrow: "PREMIUM STRONG PICKS",
          title: "بطاقة الترشيحات القوية",
          description:
            "اختر عدد الترشيحات، وسيحدد محرك الذكاء الاصطناعي أقوى الفرص المؤهلة دون خفض معايير الجودة.",
          lockedTitle: "ميزة حصرية لمشتركي Premium",
          lockedDescription:
            "قم بالترقية إلى Premium لإنشاء بطاقة مخصصة من أقوى ترشيحات المباريات.",
          upgrade: "عرض خطط الاشتراك",
          pickCount: "عدد الترشيحات",
          generate: "إنشاء البطاقة",
          generating: "جاري إنشاء البطاقة...",
          average: "متوسط الاحتمال",
          selected: "الترشيحات المختارة",
          probability: "الاحتمال",
          confidence: "الثقة",
          complete: "تم إنشاء البطاقة كاملة.",
          partial:
            "لم يجد المحرك العدد المطلوب بالجودة المحددة، لذلك لم يتم تخفيض معايير الاختيار.",
          empty: "لا توجد ترشيحات مؤهلة حاليًا.",
          error:
            "تعذر إنشاء البطاقة حاليًا. يرجى المحاولة مرة أخرى.",
          matchResult: "نتيجة المباراة",
          doubleChance: "فرصة مزدوجة",
          drawNoBet: "تعادل لا رهان",
          btts: "تسجيل الفريقين",
          total: "مجموع الأهداف",
          homeWin: "فوز صاحب الأرض",
          draw: "تعادل",
          awayWin: "فوز الضيف",
          homeOrDraw: "صاحب الأرض أو تعادل 1X",
          homeOrAway: "صاحب الأرض أو الضيف 12",
          drawOrAway: "تعادل أو الضيف X2",
          home: "صاحب الأرض",
          away: "الضيف",
          yes: "نعم",
          no: "لا",
          over: "أكثر من",
          under: "أقل من",
        }
      : locale === "sv"
        ? {
            eyebrow: "PREMIUM STRONG PICKS",
            title: "Starka matchval",
            description:
              "Välj antal tips så väljer AI-motorn de starkaste kvalificerade alternativen utan att sänka kvalitetskraven.",
            lockedTitle: "Exklusivt för Premium",
            lockedDescription:
              "Uppgradera till Premium för att skapa ett personligt kort med de starkaste matchtipsen.",
            upgrade: "Visa abonnemang",
            pickCount: "Antal tips",
            generate: "Skapa kort",
            generating: "Skapar kort...",
            average: "Genomsnittlig sannolikhet",
            selected: "Valda tips",
            probability: "Sannolikhet",
            confidence: "Säkerhet",
            complete: "Kortet skapades komplett.",
            partial:
              "AI-motorn hittade inte tillräckligt många val med den fastställda kvaliteten. Kvalitetskraven sänktes inte.",
            empty: "Inga kvalificerade tips finns just nu.",
            error:
              "Kortet kunde inte skapas just nu. Försök igen.",
            matchResult: "Matchresultat",
            doubleChance: "Dubbelchans",
            drawNoBet: "Oavgjort inget spel",
            btts: "Båda lagen gör mål",
            total: "Totalt antal mål",
            homeWin: "Hemmaseger",
            draw: "Oavgjort",
            awayWin: "Bortaseger",
            homeOrDraw: "Hemma eller oavgjort 1X",
            homeOrAway: "Hemma eller borta 12",
            drawOrAway: "Oavgjort eller borta X2",
            home: "Hemma",
            away: "Borta",
            yes: "Ja",
            no: "Nej",
            over: "Över",
            under: "Under",
          }
        : {
            eyebrow: "PREMIUM STRONG PICKS",
            title: "Strong Picks Card",
            description:
              "Choose how many picks you want and the AI engine will select the strongest qualified opportunities without lowering the quality thresholds.",
            lockedTitle: "Exclusive to Premium",
            lockedDescription:
              "Upgrade to Premium to build a personalized card from the strongest match predictions.",
            upgrade: "View Subscription Plans",
            pickCount: "Number of picks",
            generate: "Generate Card",
            generating: "Generating card...",
            average: "Average probability",
            selected: "Selected picks",
            probability: "Probability",
            confidence: "Confidence",
            complete: "Your complete card is ready.",
            partial:
              "The engine could not find the full requested number at the required quality. Selection thresholds were not reduced.",
            empty: "No qualified picks are currently available.",
            error:
              "The card could not be generated right now. Please try again.",
            matchResult: "Match Result",
            doubleChance: "Double Chance",
            drawNoBet: "Draw No Bet",
            btts: "Both Teams to Score",
            total: "Total Goals",
            homeWin: "Home Win",
            draw: "Draw",
            awayWin: "Away Win",
            homeOrDraw: "Home or Draw 1X",
            homeOrAway: "Home or Away 12",
            drawOrAway: "Draw or Away X2",
            home: "Home",
            away: "Away",
            yes: "Yes",
            no: "No",
            over: "Over",
            under: "Under",
          };

  function marketLabel(pick: StrongPick): string {
    if (pick.market === "match_result") {
      return t.matchResult;
    }

    if (pick.market === "double_chance") {
      return t.doubleChance;
    }

    if (pick.market === "draw_no_bet") {
      return t.drawNoBet;
    }

    if (pick.market === "btts") {
      return t.btts;
    }

    if (pick.market.startsWith("total_")) {
      return `${t.total} ${pick.market.replace("total_", "")}`;
    }

    return pick.market;
  }

  function selectionLabel(pick: StrongPick): string {
    const labels: Record<string, string> = {
      home_win: t.homeWin,
      draw: t.draw,
      away_win: t.awayWin,
      home_or_draw_1x: t.homeOrDraw,
      home_or_away_12: t.homeOrAway,
      draw_or_away_x2: t.drawOrAway,
      home: t.home,
      away: t.away,
      yes: t.yes,
      no: t.no,
    };

    if (pick.selection === "over") {
      return `${t.over} ${pick.market.replace("total_", "")}`;
    }

    if (pick.selection === "under") {
      return `${t.under} ${pick.market.replace("total_", "")}`;
    }

    return labels[pick.selection] ?? pick.selection;
  }

  async function generateCard() {
    setLoading(true);
    setError(null);

    try {
      const result = await getStrongPicks(count);
      setCard(result);
    } catch {
      setCard(null);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 sm:mt-12">
      <div className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-950/20 via-slate-950 to-violet-950/30">
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black tracking-[0.2em] text-amber-300">
                {t.eyebrow}
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                {t.title}
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                {t.description}
              </p>
            </div>

            <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-200">
              PREMIUM
            </div>
          </div>

          {!hasPremiumAccess ? (
            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:p-6">
              <h3 className="text-lg font-black text-white">
                {t.lockedTitle}
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {t.lockedDescription}
              </p>

              <Link
                href="/subscription"
                className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300"
              >
                {t.upgrade}
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-end">
                <label className="flex-1">
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    {t.pickCount}
                  </span>

                  <select
                    value={count}
                    onChange={(event) =>
                      setCount(Number(event.target.value))
                    }
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-bold text-white outline-none transition focus:border-amber-400 disabled:opacity-60"
                  >
                    {COUNTS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={generateCard}
                  disabled={loading}
                  className="rounded-xl bg-amber-400 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? t.generating : t.generate}
                </button>
              </div>

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {card ? (
                <div className="mt-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t.selected}
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {card.selected_count}/{card.requested_count}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t.average}
                      </p>
                      <p className="mt-2 text-2xl font-black text-emerald-300">
                        {percentage(card.average_probability)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-4 rounded-2xl border p-4 text-sm ${
                      card.complete
                        ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-200"
                        : "border-amber-500/20 bg-amber-950/20 text-amber-200"
                    }`}
                  >
                    {card.complete ? t.complete : t.partial}
                  </div>

                  {card.picks.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-slate-400">
                      {t.empty}
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {card.picks.map((pick, index) => (
                        <article
                          key={`${pick.match_id ?? pick.fixture_id ?? index}-${pick.market}`}
                          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-500">
                                #{index + 1}
                                {pick.league
                                  ? ` · ${pick.league}`
                                  : ""}
                              </p>

                              <h3 className="mt-2 font-black text-white">
                                {pick.home_team ?? "—"}
                                <span className="mx-2 text-slate-600">
                                  vs
                                </span>
                                {pick.away_team ?? "—"}
                              </h3>
                            </div>

                            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-black text-emerald-300">
                              {percentage(pick.probability)}
                            </span>
                          </div>

                          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {marketLabel(pick)}
                            </p>

                            <p className="mt-1 text-lg font-black text-amber-200">
                              {selectionLabel(pick)}
                            </p>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">
                                {t.probability}
                              </p>
                              <p className="mt-1 font-black text-white">
                                {percentage(pick.probability)}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-500">
                                {t.confidence}
                              </p>
                              <p className="mt-1 font-black text-white">
                                {percentage(pick.confidence_score)}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
