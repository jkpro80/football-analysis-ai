import Link from "next/link";

import TeamLogo from "@/components/match/TeamLogo";
import {
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/ui";

type HeroTeam = {
  id: number;
  name: string;
};

type MatchHeroProps = {
  modelVersion: string;
  fixtureId: number;
  fixtureStatus: string;
  fixtureDate: string;
  homeTeam: HeroTeam;
  awayTeam: HeroTeam;
  predictedScore: string;
  confidenceScore: number;
  confidenceLabel: string;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  expectedGoalsTotal: number;
  bestPrediction: string;
  bestPredictionProbability: number;
};

function formatMatchDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: value,
      time: "",
    };
  }

  return {
    date: new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "full",
    }).format(date),
    time: new Intl.DateTimeFormat("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function translateStatus(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("live")) {
    return {
      label: "مباشر",
      tone: "red" as const,
    };
  }

  if (
    normalized.includes("finish") ||
    normalized.includes("completed")
  ) {
    return {
      label: "انتهت",
      tone: "green" as const,
    };
  }

  return {
    label: "مجدولة",
    tone: "cyan" as const,
  };
}

function confidenceText(label: string) {
  const labels: Record<string, string> = {
    very_high: "عالية جدًا",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return labels[label] ?? label;
}

export default function MatchHero({
  modelVersion,
  fixtureId,
  fixtureStatus,
  fixtureDate,
  homeTeam,
  awayTeam,
  predictedScore,
  confidenceScore,
  confidenceLabel,
  expectedGoalsHome,
  expectedGoalsAway,
  expectedGoalsTotal,
  bestPrediction,
  bestPredictionProbability,
}: MatchHeroProps) {
  const formattedDate = formatMatchDate(fixtureDate);
  const status = translateStatus(fixtureStatus);

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.14),transparent_35%)] p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label="Football Analysis AI V7"
                tone="cyan"
              />

              <StatusBadge
                label={modelVersion}
                tone="violet"
              />

              <StatusBadge
                label={status.label}
                tone={status.tone}
              />
            </div>

            <h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
              مركز تحليل المباراة
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              مباراة رقم #{fixtureId}
            </p>
          </div>

          <Link
            href="/fixtures"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-bold text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-white"
          >
            العودة إلى المباريات
          </Link>
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] border border-cyan-400/20 bg-cyan-500/10 p-3 shadow-[0_20px_60px_rgba(6,182,212,0.12)]">
              <TeamLogo
                teamId={homeTeam.id}
                teamName={homeTeam.name}
                size={88}
              />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Home Team
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              {homeTeam.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              الفريق المضيف
            </p>
          </div>

          <div className="min-w-[280px] text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
              AI Prediction
            </p>

            <div className="mt-3 rounded-[30px] border border-slate-700/80 bg-slate-950/75 px-8 py-7 shadow-2xl backdrop-blur">
              <p className="text-6xl font-black tracking-[0.2em] text-white">
                {predictedScore}
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-bold text-cyan-300">
                  xG {expectedGoalsHome.toFixed(2)}
                </span>

                <span className="text-slate-600">—</span>

                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-300">
                  xG {expectedGoalsAway.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              {formattedDate.date}
              {formattedDate.time
                ? ` • ${formattedDate.time}`
                : ""}
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] border border-violet-400/20 bg-violet-500/10 p-3 shadow-[0_20px_60px_rgba(139,92,246,0.12)]">
              <TeamLogo
                teamId={awayTeam.id}
                teamName={awayTeam.name}
                size={88}
              />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
              Away Team
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              {awayTeam.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              الفريق الضيف
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="درجة الثقة"
          value={`${Math.round(confidenceScore)}%`}
          subtitle={`ثقة ${confidenceText(confidenceLabel)}`}
          icon="◎"
          accent="cyan"
        />

        <StatCard
          label="أفضل توقع"
          value={bestPrediction}
          subtitle={`${bestPredictionProbability.toFixed(1)}%`}
          icon="✦"
          accent="emerald"
        />

        <StatCard
          label="إجمالي الأهداف المتوقعة"
          value={expectedGoalsTotal.toFixed(2)}
          subtitle="Expected Goals"
          icon="⚽"
          accent="violet"
        />

        <StatCard
          label="موعد المباراة"
          value={formattedDate.time || "—"}
          subtitle={formattedDate.date}
          icon="◷"
          accent="amber"
        />
      </div>
    </Panel>
  );
}