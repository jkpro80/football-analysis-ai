"use client";

import Link from "next/link";

import type { Prediction } from "@/types/prediction";

function formatDate(value: string): string {
  const normalizedValue =
    value.length === 10
      ? `${value}T00:00:00`
      : value.replace(" ", "T");

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: value.length > 10 ? "2-digit" : undefined,
    minute: value.length > 10 ? "2-digit" : undefined,
  }).format(date);
}

function formatNumber(value: number | null | undefined): string {
  return Number(value ?? 0).toFixed(2);
}

function translatePick(
  key: string | null | undefined,
): string {
  if (!key) {
    return "غير متوفر";
  }

  const labels: Record<string, string> = {
    home_win: "فوز صاحب الأرض",
    draw: "تعادل",
    away_win: "فوز الفريق الضيف",
  };

  return labels[key] ?? key;
}
function translateConfidence(label: string): string {
  const labels: Record<string, string> = {
    very_high: "عالية جدًا",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return labels[label] ?? label;
}

function confidenceClasses(label: string): string {
  if (label === "very_high" || label === "high") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (label === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function probabilityWidth(value: number | null | undefined): string {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value ?? 0)),
  );

  return `${safeValue}%`;
}

export default function PredictionCard({
  prediction,
}: {
  prediction: Prediction;
}) {
  const {
    fixture,
    teams,
    expected_goals,
    probabilities,
    predicted_score,
    best_pick,
    confidence,
  } = prediction;

  const homeLogoUrl =
    teams.home.logo_url ??
    teams.home.logo ??
    null;

  const awayLogoUrl =
    teams.away.logo_url ??
    teams.away.logo ??
    null;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-black/10">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">
              المباراة رقم {fixture.id}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-300">
              {formatDate(fixture.date)}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClasses(
              confidence.label,
            )}`}
          >
            الثقة: {translateConfidence(confidence.label)}{" "}
            {formatNumber(confidence.score)}%
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamBlock
            name={teams.home.name}
            country={teams.home.country ?? null}
            logoUrl={homeLogoUrl}
            side="home"
          />

          <div className="text-center">
            <p className="text-xs text-slate-500">
              النتيجة المتوقعة
            </p>

            <p className="mt-2 rounded-xl bg-slate-950 px-4 py-2 text-2xl font-black text-cyan-300">
              {predicted_score}
            </p>
          </div>

          <TeamBlock
            name={teams.away.name}
            country={teams.away.country ?? null}
            logoUrl={awayLogoUrl}
            side="away"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">
                أفضل توقع
              </p>

              <p className="mt-1 font-bold text-cyan-300">
                {translatePick(best_pick.key)}
              </p>
            </div>

            <p className="text-2xl font-black text-white">
              {formatNumber(best_pick.probability)}%
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="mb-3 text-sm font-bold text-slate-200">
            احتمالات نتيجة المباراة
          </h2>

          <div className="space-y-3">
            <ProbabilityBar
              label={`فوز ${teams.home.name}`}
              value={probabilities.home_win}
            />

            <ProbabilityBar
              label="التعادل"
              value={probabilities.draw}
            />

            <ProbabilityBar
              label={`فوز ${teams.away.name}`}
              value={probabilities.away_win}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniStat
            title="أكثر من 2.5"
            value={probabilities.over_2_5}
          />

          <MiniStat
            title="أقل من 2.5"
            value={probabilities.under_2_5}
          />

          <MiniStat
            title="يسجل الفريقان"
            value={probabilities.btts}
          />

          <MiniStat
            title="لا يسجل الفريقان"
            value={probabilities.no_btts}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-slate-950/70 p-4 text-center">
          <ExpectedGoal
            title={teams.home.name}
            value={expected_goals.home}
          />

          <ExpectedGoal
            title="المجموع"
            value={expected_goals.total}
          />

          <ExpectedGoal
            title={teams.away.name}
            value={expected_goals.away}
          />
        </div>

        <Link
          href={`/matches/${fixture.id}`}
          className="mt-5 block rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
        >
          عرض التحليل الكامل
        </Link>
      </div>
    </article>
  );
}

function TeamBlock({
  name,
  country,
  logoUrl,
  side,
}: {
  name: string;
  country: string | null;
  logoUrl: string | null;
  side: "home" | "away";
}) {
  const alignment =
    side === "home"
      ? "items-start text-right"
      : "items-end text-left";

  return (
    <div
      className={`flex min-w-0 flex-col gap-3 ${alignment}`}
    >
      <div className="relative">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`شعار ${name}`}
            loading="lazy"
            className="h-16 w-16 rounded-2xl border border-slate-700 bg-white object-contain p-2 shadow-lg shadow-black/20"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-xl font-black text-slate-300">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <span
          className={`absolute -bottom-2 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-300 ${
            side === "home" ? "-right-2" : "-left-2"
          }`}
        >
          {side === "home" ? "HOME" : "AWAY"}
        </span>
      </div>

      <div className="min-w-0">
        <p className="break-words text-sm font-bold leading-6 text-white sm:text-base">
          {name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {country || "غير محدد"}
        </p>
      </div>
    </div>
  );
}

function ProbabilityBar({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="truncate text-slate-400">
          {label}
        </span>

        <span className="font-bold text-slate-200">
          {formatNumber(value)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{
            width: probabilityWidth(value),
          }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  title,
  value,
}: {
  title: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-lg font-bold text-white">
        {formatNumber(value)}%
      </p>
    </div>
  );
}

function ExpectedGoal({
  title,
  value,
}: {
  title: string;
  value: number | null | undefined;
}) {
  return (
    <div>
      <p className="truncate text-xs text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-black text-cyan-300">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        xG
      </p>
    </div>
  );
}