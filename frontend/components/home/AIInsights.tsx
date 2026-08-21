"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

import type { DashboardFixture } from "./types";

type InsightTone =
  | "cyan"
  | "emerald"
  | "amber"
  | "rose";

type Insight = {
  id: string;
  category: string;
  title: string;
  description: string;
  metric: string;
  icon: string;
  tone: InsightTone;
  matchId: number;
};

type AIInsightsProps = {
  fixtures: DashboardFixture[];
};

const tones = {
  cyan: {
    border: "border-cyan-400/20",
    badge: "bg-cyan-400/10 text-cyan-300",
    metric: "text-cyan-300",
  },
  emerald: {
    border: "border-emerald-400/20",
    badge: "bg-emerald-400/10 text-emerald-300",
    metric: "text-emerald-300",
  },
  amber: {
    border: "border-amber-400/20",
    badge: "bg-amber-400/10 text-amber-300",
    metric: "text-amber-300",
  },
  rose: {
    border: "border-rose-400/20",
    badge: "bg-rose-400/10 text-rose-300",
    metric: "text-rose-300",
  },
} as const;

function fixtureTitle(
  fixture: DashboardFixture,
): string {
  return `${fixture.homeTeam.name} × ${fixture.awayTeam.name}`;
}

function percentage(
  value: number | undefined,
): string {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function highestFixture(
  fixtures: DashboardFixture[],
  getValue: (
    fixture: DashboardFixture,
  ) => number,
): DashboardFixture | undefined {
  return [...fixtures].sort(
    (first, second) =>
      getValue(second) - getValue(first),
  )[0];
}

function getText(locale: Locale) {
  if (locale === "ar") {
    return {
      title: "رؤى الذكاء الاصطناعي",
      subtitle:
        "إشارات مستخرجة مباشرة من توقعات المحرك الحالية.",
      viewAnalysis: "عرض التحليلات",
      noData:
        "لا توجد بيانات كافية لإنشاء الرؤى حاليًا.",

      highConfidenceCategory: "ثقة مرتفعة",
      highConfidenceDescription:
        "أعلى مباراة حاليًا من حيث درجة اتفاق مؤشرات محرك التوقعات.",

      bttsCategory: "إشارة تسجيل الفريقين",
      bttsDescription:
        "أعلى احتمال متاح حاليًا لتسجيل الفريقين في المباراة.",

      goalsCategory: "إشارة الأهداف",
      goalsDescription:
        "أعلى احتمال متاح لتجاوز إجمالي المباراة حاجز 2.5 هدف.",

      bestPickCategory: "أفضل اختيار",
      bestPickDescription: (
        match: string,
      ) => `أفضل اختيار في مباراة ${match}.`,
    };
  }

  if (locale === "sv") {
    return {
      title: "AI-insikter",
      subtitle:
        "Signaler som hämtas direkt från motorns aktuella prognoser.",
      viewAnalysis: "Visa analyser",
      noData:
        "Det finns inte tillräckligt med data för att skapa insikter just nu.",

      highConfidenceCategory: "HÖG SÄKERHET",
      highConfidenceDescription:
        "Matchen med högst samstämmighet mellan prognosmotorns indikatorer.",

      bttsCategory: "BTTS-SIGNAL",
      bttsDescription:
        "Den högsta aktuella sannolikheten för att båda lagen gör mål.",

      goalsCategory: "MÅLSIGNAL",
      goalsDescription:
        "Den högsta aktuella sannolikheten för fler än 2,5 mål i matchen.",

      bestPickCategory: "BÄSTA VAL",
      bestPickDescription: (
        match: string,
      ) => `Det bästa valet i matchen ${match}.`,
    };
  }

  return {
    title: "AI Insights",
    subtitle:
      "Signals extracted directly from the prediction engine's current forecasts.",
    viewAnalysis: "View analyses",
    noData:
      "There is not enough data to generate insights right now.",

    highConfidenceCategory: "HIGH CONFIDENCE",
    highConfidenceDescription:
      "The match with the highest agreement across the prediction engine indicators.",

    bttsCategory: "BTTS SIGNAL",
    bttsDescription:
      "The highest currently available probability that both teams will score.",

    goalsCategory: "GOALS SIGNAL",
    goalsDescription:
      "The highest currently available probability of more than 2.5 total goals.",

    bestPickCategory: "BEST PICK",
    bestPickDescription: (
      match: string,
    ) => `The best pick for ${match}.`,
  };
}

function translateBestPick(
  key: string,
  fallbackLabel: string,
  locale: Locale,
): string {
  const normalizedKey = String(key ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  const translations: Record<
    string,
    { ar: string; en: string; sv: string }
  > = {
    home_win: {
      ar: "فوز الفريق المضيف",
      en: "Home Win",
      sv: "Hemmaseger",
    },
    home: {
      ar: "فوز الفريق المضيف",
      en: "Home Win",
      sv: "Hemmaseger",
    },
    away_win: {
      ar: "فوز الفريق الضيف",
      en: "Away Win",
      sv: "Bortaseger",
    },
    away: {
      ar: "فوز الفريق الضيف",
      en: "Away Win",
      sv: "Bortaseger",
    },
    draw: {
      ar: "التعادل",
      en: "Draw",
      sv: "Oavgjort",
    },
    btts: {
      ar: "تسجيل الفريقين",
      en: "Both Teams to Score",
      sv: "Båda lagen gör mål",
    },
    no_btts: {
      ar: "عدم تسجيل الفريقين",
      en: "Both Teams Not to Score",
      sv: "Båda lagen gör inte mål",
    },
    over_2_5: {
      ar: "أكثر من 2.5 هدف",
      en: "Over 2.5 Goals",
      sv: "Över 2,5 mål",
    },
    under_2_5: {
      ar: "أقل من 2.5 هدف",
      en: "Under 2.5 Goals",
      sv: "Under 2,5 mål",
    },
  };

  const translation = translations[normalizedKey];

  if (!translation) {
    return fallbackLabel;
  }

  return translation[locale];
}
function buildInsights(
  fixtures: DashboardFixture[],
  locale: Locale,
): Insight[] {
  if (fixtures.length === 0) {
    return [];
  }

  const t = getText(locale);

  const highestConfidence = highestFixture(
    fixtures,
    (fixture) =>
      fixture.confidence?.score ?? 0,
  );

  const highestBtts = highestFixture(
    fixtures,
    (fixture) =>
      fixture.probabilities?.btts ?? 0,
  );

  const highestOver25 = highestFixture(
    fixtures,
    (fixture) =>
      fixture.probabilities?.over25 ?? 0,
  );

  const highestBestPick = highestFixture(
    fixtures.filter(
      (fixture) =>
        fixture.bestPick !== undefined,
    ),
    (fixture) =>
      fixture.bestPick?.probability ?? 0,
  );

  const insights: Insight[] = [];

  if (highestConfidence) {
    insights.push({
      id: "highest-confidence",
      category:
        t.highConfidenceCategory,
      title:
        fixtureTitle(highestConfidence),
      description:
        t.highConfidenceDescription,
      metric: percentage(
        highestConfidence.confidence?.score,
      ),
      icon: "◎",
      tone: "cyan",
      matchId: highestConfidence.id,
    });
  }

  if (highestBtts) {
    insights.push({
      id: "highest-btts",
      category: t.bttsCategory,
      title: fixtureTitle(highestBtts),
      description: t.bttsDescription,
      metric: percentage(
        highestBtts.probabilities?.btts,
      ),
      icon: "⚽",
      tone: "emerald",
      matchId: highestBtts.id,
    });
  }

  if (highestOver25) {
    insights.push({
      id: "highest-over-25",
      category: t.goalsCategory,
      title: fixtureTitle(highestOver25),
      description: t.goalsDescription,
      metric: percentage(
        highestOver25.probabilities?.over25,
      ),
      icon: "↗",
      tone: "amber",
      matchId: highestOver25.id,
    });
  }

  if (highestBestPick?.bestPick) {
    const match =
      fixtureTitle(highestBestPick);

    insights.push({
      id: "highest-best-pick",
      category: t.bestPickCategory,

      // نبقي قيمة المحرك نفسها دون تغيير
      // حتى لا نغيّر منطق Prediction Engine.
      title:
        translateBestPick(
          highestBestPick.bestPick.key,
          highestBestPick.bestPick.label,
          locale,
        ),

      description:
        t.bestPickDescription(match),

      metric: percentage(
        highestBestPick.bestPick
          .probability,
      ),
      icon: "✦",
      tone: "rose",
      matchId: highestBestPick.id,
    });
  }

  return insights;
}

export default function AIInsights({
  fixtures,
}: AIInsightsProps) {
  const {
    locale,
    direction,
  } = useLocale();

  const t = getText(locale);

  const insights =
    buildInsights(
      fixtures,
      locale,
    );

  return (
    <section
      dir={direction}
      className="rounded-xl border border-slate-800 bg-slate-950/55 p-3 sm:rounded-3xl sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-[9px] font-black tracking-[0.14em] text-violet-400 sm:text-xs sm:tracking-[0.18em]">
            AI INSIGHTS
          </p>

          <h2 className="mt-1 text-lg font-black text-white sm:mt-2 sm:text-2xl">
            {t.title}
          </h2>

          <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:mt-2 sm:text-sm">
            {t.subtitle}
          </p>
        </div>

        <Link
          href="/statistics"
          className="text-[11px] font-black text-violet-300 transition hover:text-violet-200 sm:text-sm"
        >
          {direction === "rtl"
            ? `${t.viewAnalysis} ←`
            : `${t.viewAnalysis} →`}
        </Link>
      </div>

      {insights.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#071023] p-5 text-sm text-slate-500">
          {t.noData}
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-4">
          {insights.map((item) => {
            const tone =
              tones[item.tone];

            return (
              <Link
                key={item.id}
                href={`/matches/${item.matchId}`}
                className={`rounded-xl border bg-[#071023] p-2.5 transition hover:-translate-y-0.5 hover:bg-slate-900/70 sm:rounded-2xl sm:p-4 ${tone.border}`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black tracking-[0.10em] sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em] ${tone.badge}`}
                    >
                      {item.category}
                    </span>

                    <h3 className="mt-1.5 text-xs font-black leading-4 text-white sm:mt-3 sm:text-base">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-[10px] leading-4 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-left">
                    <span className="text-sm sm:text-lg">
                      {item.icon}
                    </span>

                    <p
                      dir="ltr"
                      className={`mt-1 text-lg font-black tabular-nums sm:mt-2 sm:text-2xl ${tone.metric}`}
                    >
                      {item.metric}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}


