import Link from "next/link";

import type {
  Prediction,
  Team,
} from "@/types/prediction";

type Props = {
  predictions: Prediction[];
};

function translatePick(
  key: string | null | undefined,
): string {
  if (!key) {
    return "غير محدد";
  }

  const labels: Record<string, string> = {
    home_win: "فوز صاحب الأرض",
    draw: "تعادل",
    away_win: "فوز الفريق الضيف",
    over_2_5: "أكثر من 2.5 هدف",
    under_2_5: "أقل من 2.5 هدف",
    btts: "يسجل الفريقان",
    no_btts: "لا يسجل الفريقان",
  };

  return labels[key] ?? key;
}

function translateConfidence(
  label: string | null | undefined,
): string {
  if (!label) {
    return "غير محددة";
  }

  const labels: Record<string, string> = {
    very_high: "عالية جدًا",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return labels[label] ?? label;
}

function TeamLogo({
  team,
}: {
  team: Team;
}) {
  const logoUrl =
    team.logo_url ?? team.logo ?? null;

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`شعار ${team.name}`}
        className="h-20 w-20 rounded-2xl border border-slate-700 bg-white object-contain p-2 shadow-xl shadow-black/20"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-2xl font-black text-slate-300">
      {team.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function HeroPrediction({
  predictions,
}: Props) {
  if (predictions.length === 0) {
    return null;
  }

  const bestPrediction = [...predictions].sort(
    (firstPrediction, secondPrediction) =>
      (secondPrediction.best_pick.probability ??
        0) -
      (firstPrediction.best_pick.probability ??
        0),
  )[0];

  if (!bestPrediction) {
    return null;
  }

  const bestPickProbability =
    bestPrediction.best_pick.probability ?? 0;

  const confidenceScore =
    bestPrediction.confidence.score ?? 0;

  const predictedScore =
    bestPrediction.predicted_score ?? "—";

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-300">
            🔥 أعلى توقع متاح
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            أفضل فرصة حسب محرك التوقعات
          </h2>
        </div>

        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
          {bestPickProbability.toFixed(1)}%
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <TeamLogo
            team={bestPrediction.teams.home}
          />

          <div>
            <p className="font-bold text-white">
              {bestPrediction.teams.home.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {bestPrediction.teams.home
                .country || "غير محدد"}
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            النتيجة المتوقعة
          </p>

          <p className="mt-2 rounded-2xl bg-slate-950 px-6 py-3 text-3xl font-black text-cyan-300">
            {predictedScore}
          </p>

          <p className="mt-4 text-sm text-slate-400">
            {translatePick(
              bestPrediction.best_pick.key,
            )}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <TeamLogo
            team={bestPrediction.teams.away}
          />

          <div>
            <p className="font-bold text-white">
              {bestPrediction.teams.away.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {bestPrediction.teams.away
                .country || "غير محدد"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-500">
            مستوى الثقة
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {translateConfidence(
              bestPrediction.confidence.label,
            )}{" "}
            {confidenceScore}%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-500">
            أفضل اختيار
          </p>

          <p className="mt-2 text-lg font-bold text-cyan-300">
            {translatePick(
              bestPrediction.best_pick.key,
            )}
          </p>
        </div>
      </div>

      <Link
        href={`/matches/${bestPrediction.fixture.id}`}
        className="mt-6 block rounded-xl bg-cyan-500 px-5 py-3 text-center font-bold text-slate-950 transition hover:bg-cyan-400"
      >
        عرض التحليل الكامل
      </Link>
    </section>
  );
}