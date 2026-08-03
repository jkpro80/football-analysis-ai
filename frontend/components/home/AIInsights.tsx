import Link from "next/link";

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

function percentage(value: number | undefined): string {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function highestFixture(
  fixtures: DashboardFixture[],
  getValue: (fixture: DashboardFixture) => number,
): DashboardFixture | undefined {
  return [...fixtures].sort(
    (first, second) =>
      getValue(second) - getValue(first),
  )[0];
}

function buildInsights(
  fixtures: DashboardFixture[],
): Insight[] {
  if (fixtures.length === 0) {
    return [];
  }

  const highestConfidence = highestFixture(
    fixtures,
    (fixture) => fixture.confidence?.score ?? 0,
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
      (fixture) => fixture.bestPick !== undefined,
    ),
    (fixture) =>
      fixture.bestPick?.probability ?? 0,
  );

  const insights: Insight[] = [];

  if (highestConfidence) {
    insights.push({
      id: "highest-confidence",
      category: "HIGH CONFIDENCE",
      title: fixtureTitle(highestConfidence),
      description:
        "أعلى مباراة حاليًا من حيث درجة اتفاق مؤشرات محرك التوقعات.",
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
      category: "BTTS SIGNAL",
      title: fixtureTitle(highestBtts),
      description:
        "أعلى احتمال متاح حاليًا لتسجيل الفريقين في المباراة.",
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
      category: "GOALS SIGNAL",
      title: fixtureTitle(highestOver25),
      description:
        "أعلى احتمال متاح لتجاوز إجمالي المباراة حاجز 2.5 هدف.",
      metric: percentage(
        highestOver25.probabilities?.over25,
      ),
      icon: "↗",
      tone: "amber",
      matchId: highestOver25.id,
    });
  }

  if (highestBestPick?.bestPick) {
    insights.push({
      id: "highest-best-pick",
      category: "BEST PICK",
      title: highestBestPick.bestPick.label,
      description:
        `أفضل اختيار في مباراة ${fixtureTitle(highestBestPick)}.`,
      metric: percentage(
        highestBestPick.bestPick.probability,
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
  const insights = buildInsights(fixtures);

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-violet-400">
            AI INSIGHTS
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            رؤى الذكاء الاصطناعي
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            إشارات مستخرجة مباشرة من توقعات المحرك الحالية.
          </p>
        </div>

        <Link
          href="/statistics"
          className="text-sm font-black text-violet-300 transition hover:text-violet-200"
        >
          عرض التحليلات ←
        </Link>
      </div>

      {insights.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#071023] p-5 text-sm text-slate-500">
          لا توجد بيانات كافية لإنشاء الرؤى حاليًا.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {insights.map((item) => {
            const tone = tones[item.tone];

            return (
              <Link
                key={item.id}
                href={`/matches/${item.matchId}`}
                className={`rounded-2xl border bg-[#071023] p-4 transition hover:-translate-y-0.5 hover:bg-slate-900/70 ${tone.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.14em] ${tone.badge}`}
                    >
                      {item.category}
                    </span>

                    <h3 className="mt-3 font-black text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-left">
                    <span className="text-lg">
                      {item.icon}
                    </span>

                    <p
                      dir="ltr"
                      className={`mt-2 text-2xl font-black tabular-nums ${tone.metric}`}
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
