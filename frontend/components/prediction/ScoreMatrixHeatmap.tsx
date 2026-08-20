"use client";

import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

type ScoreMatrixCell = {
  home_goals: number;
  away_goals: number;
  score: string;
  probability: number;
};

type ScoreMatrixHeatmapProps = {
  matrix: ScoreMatrixCell[];
  mostLikelyScore?: string | null;
  recommendedScore?: string | null;
  homeWin?: number;
  draw?: number;
  awayWin?: number;
  entropy?: number | null;
  topFiveConcentration?: number | null;
  maxGoals?: number;
};

const TEXT = {
  ar: {
    title: "خريطة احتمالات النتائج",
    unavailable:
      "بيانات مصفوفة النتائج غير متاحة لهذه المباراة.",
    description:
      "الصفوف تمثل أهداف الفريق المضيف، والأعمدة تمثل أهداف الفريق الضيف. الخلايا الأكثر سطوعًا تمثل النتائج ذات الاحتمال الأعلى.",
    resultsRange: "النتائج من 0 إلى",
    highestSingleScore: "أعلى نتيجة منفردة",
    recommendedScore: "النتيجة المتوافقة",
    entropy: "تشتت النتائج",
    topFive: "تركّز أفضل 5 نتائج",
    homeWin: "فوز المضيف",
    draw: "التعادل",
    awayWin: "فوز الضيف",
    purpleLegend: "البنفسجي: أعلى نتيجة منفردة",
    greenLegend: "الأخضر: النتيجة المتوافقة",
    goldLegend: "الذهبي: النتيجتان متطابقتان",
    homeAway: "مضيف / ضيف",
    score: "النتيجة",
    probability: "الاحتمال",
    probabilityWith: "باحتمال",
  },
  en: {
    title: "Score Probability Matrix",
    unavailable:
      "Score matrix data is not available for this match.",
    description:
      "Rows represent the home team's goals and columns represent the away team's goals. Brighter cells indicate more likely scorelines.",
    resultsRange: "Scores from 0 to",
    highestSingleScore: "Highest Single Score",
    recommendedScore: "Recommended Score",
    entropy: "Score Dispersion",
    topFive: "Top 5 Score Concentration",
    homeWin: "Home Win",
    draw: "Draw",
    awayWin: "Away Win",
    purpleLegend: "Purple: Highest single score",
    greenLegend: "Green: Recommended score",
    goldLegend: "Gold: Both scores match",
    homeAway: "Home / Away",
    score: "Score",
    probability: "probability",
    probabilityWith: "with probability",
  },
  sv: {
    title: "Resultatsannolikhetsmatris",
    unavailable:
      "Resultatmatrisen är inte tillgänglig för den här matchen.",
    description:
      "Raderna visar hemmalagets mål och kolumnerna visar bortalagets mål. Ljusare celler representerar mer sannolika resultat.",
    resultsRange: "Resultat från 0 till",
    highestSingleScore: "Troligaste enskilda resultat",
    recommendedScore: "Rekommenderat resultat",
    entropy: "Resultatspridning",
    topFive: "Koncentration av topp 5-resultat",
    homeWin: "Hemmaseger",
    draw: "Oavgjort",
    awayWin: "Bortaseger",
    purpleLegend: "Lila: Troligaste enskilda resultat",
    greenLegend: "Grön: Rekommenderat resultat",
    goldLegend: "Guld: Resultaten sammanfaller",
    homeAway: "Hemma / Borta",
    score: "Resultat",
    probability: "sannolikhet",
    probabilityWith: "med sannolikheten",
  },
} satisfies Record<Locale, Record<string, string>>;

function percentage(
  value: number | null | undefined,
  digits = 2,
): string {
  const resolved = Number(value ?? 0);

  return `${
    Number.isFinite(resolved)
      ? resolved.toFixed(digits)
      : "0.00"
  }%`;
}

function metricValue(
  value: number | null | undefined,
  digits = 3,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const resolved = Number(value);

  return Number.isFinite(resolved)
    ? resolved.toFixed(digits)
    : "—";
}

function cellBackground(
  probability: number,
  maximumProbability: number,
): string {
  const intensity =
    maximumProbability > 0
      ? Math.min(
          1,
          Math.max(
            0,
            probability / maximumProbability,
          ),
        )
      : 0;

  const visualIntensity = Math.pow(
    intensity,
    0.72,
  );

  if (probability >= 9) {
    return `rgba(16, 185, 129, ${
      0.34 + visualIntensity * 0.56
    })`;
  }

  if (probability >= 6) {
    return `rgba(6, 182, 212, ${
      0.25 + visualIntensity * 0.55
    })`;
  }

  if (probability >= 3) {
    return `rgba(8, 145, 178, ${
      0.18 + visualIntensity * 0.5
    })`;
  }

  if (probability >= 1) {
    return `rgba(14, 116, 144, ${
      0.13 + visualIntensity * 0.42
    })`;
  }

  return `rgba(15, 23, 42, ${
    0.52 + visualIntensity * 0.2
  })`;
}

export default function ScoreMatrixHeatmap({
  matrix,
  mostLikelyScore,
  recommendedScore,
  homeWin = 0,
  draw = 0,
  awayWin = 0,
  entropy = null,
  topFiveConcentration = null,
  maxGoals = 6,
}: ScoreMatrixHeatmapProps) {
  const { locale, direction } = useLocale();
  const text = TEXT[locale];

  const goals = Array.from(
    { length: maxGoals + 1 },
    (_, index) => index,
  );

  const visibleCells = Array.isArray(matrix)
    ? matrix.filter(
        (cell) =>
          Number.isFinite(
            Number(cell.home_goals),
          ) &&
          Number.isFinite(
            Number(cell.away_goals),
          ) &&
          cell.home_goals >= 0 &&
          cell.home_goals <= maxGoals &&
          cell.away_goals >= 0 &&
          cell.away_goals <= maxGoals,
      )
    : [];

  if (visibleCells.length === 0) {
    return (
      <section
        dir={direction}
        className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-6 sm:p-8"
      >
        <h2 className="text-2xl font-black">
          {text.title}
        </h2>

        <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-950/15 p-4 text-sm text-amber-100/80">
          {text.unavailable}
        </p>
      </section>
    );
  }

  const cellsByScore = new Map(
    visibleCells.map((cell) => [
      `${cell.home_goals}-${cell.away_goals}`,
      cell,
    ]),
  );

  const maximumProbability = Math.max(
    0,
    ...visibleCells.map((cell) =>
      Number(cell.probability ?? 0),
    ),
  );

  const outcomes = [
    {
      label: text.homeWin,
      value: homeWin,
      textClass: "text-cyan-300",
    },
    {
      label: text.draw,
      value: draw,
      textClass: "text-slate-100",
    },
    {
      label: text.awayWin,
      value: awayWin,
      textClass: "text-violet-300",
    },
  ];

  return (
    <section
      dir={direction}
      className="rounded-[32px] border border-slate-800 bg-[#050b1e] p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">
            {text.title}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {text.description}
          </p>
        </div>

        <span className="rounded-full border border-cyan-500/25 bg-cyan-950/20 px-3 py-1 text-xs font-bold text-cyan-300">
          {text.resultsRange} {maxGoals}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4">
          <p className="text-xs font-bold text-slate-400">
            {text.highestSingleScore}
          </p>

          <p
            dir="ltr"
            className="mt-2 text-3xl font-black text-violet-300"
          >
            {mostLikelyScore ?? "—"}
          </p>
        </article>

        <article className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <p className="text-xs font-bold text-slate-400">
            {text.recommendedScore}
          </p>

          <p
            dir="ltr"
            className="mt-2 text-3xl font-black text-emerald-300"
          >
            {recommendedScore ?? "—"}
          </p>
        </article>

        <article className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4">
          <p className="text-xs font-bold text-slate-400">
            {text.entropy}
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-300">
            {metricValue(entropy)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Normalized Entropy
          </p>
        </article>

        <article className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4">
          <p className="text-xs font-bold text-slate-400">
            {text.topFive}
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-300">
            {topFiveConcentration === null
              ? "—"
              : percentage(
                  topFiveConcentration,
                )}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {outcomes.map((outcome) => (
          <article
            key={outcome.label}
            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
          >
            <p className="text-xs font-bold text-slate-500">
              {outcome.label}
            </p>

            <p
              className={`mt-2 text-2xl font-black ${outcome.textClass}`}
            >
              {percentage(outcome.value)}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-violet-500/40 bg-violet-950/30 px-3 py-1 text-violet-200">
          {text.purpleLegend}
        </span>

        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-3 py-1 text-emerald-200">
          {text.greenLegend}
        </span>

        <span className="rounded-full border border-amber-400/50 bg-amber-950/30 px-3 py-1 text-amber-200">
          {text.goldLegend}
        </span>
      </div>

      <div className="mt-7 overflow-x-auto pb-2">
        <table
          dir="ltr"
          className="w-full min-w-[760px] border-separate border-spacing-2 text-center"
        >
          <thead>
            <tr>
              <th className="w-24 p-2 text-xs text-slate-500">
                {text.homeAway}
              </th>

              {goals.map((awayGoals) => (
                <th
                  key={`away-${awayGoals}`}
                  scope="col"
                  className="p-2 text-sm font-black text-violet-300"
                >
                  {awayGoals}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {goals.map((homeGoals) => (
              <tr key={`home-${homeGoals}`}>
                <th
                  scope="row"
                  className="p-2 text-sm font-black text-cyan-300"
                >
                  {homeGoals}
                </th>

                {goals.map((awayGoals) => {
                  const score =
                    `${homeGoals}-${awayGoals}`;

                  const cell =
                    cellsByScore.get(score);

                  const probability = Number(
                    cell?.probability ?? 0,
                  );

                  const isMostLikely =
                    score === mostLikelyScore;

                  const isRecommended =
                    score === recommendedScore;

                  const isBoth =
                    isMostLikely &&
                    isRecommended;

                  const emphasisClass = isBoth
                    ? "border-amber-300 ring-2 ring-amber-300/70"
                    : isMostLikely
                      ? "border-violet-400 ring-2 ring-violet-400/60"
                      : isRecommended
                        ? "border-emerald-400 ring-2 ring-emerald-400/60"
                        : "border-slate-800";

                  const markerClass = isBoth
                    ? "bg-amber-300"
                    : isMostLikely
                      ? "bg-violet-400"
                      : "bg-emerald-400";

                  return (
                    <td
                      key={score}
                      title={`${text.score} ${score} — ${text.probability} ${percentage(
                        probability,
                      )}`}
                      aria-label={`${text.score} ${score} ${text.probabilityWith} ${percentage(
                        probability,
                      )}`}
                      className={`relative h-[70px] min-w-[88px] rounded-2xl border p-2 transition duration-200 hover:-translate-y-0.5 hover:brightness-125 ${emphasisClass}`}
                      style={{
                        backgroundColor:
                          cellBackground(
                            probability,
                            maximumProbability,
                          ),
                      }}
                    >
                      <strong className="block text-base font-black text-white">
                        {score}
                      </strong>

                      <span className="mt-1 block text-xs font-bold text-slate-100">
                        {percentage(
                          probability,
                        )}
                      </span>

                      {(isMostLikely ||
                        isRecommended) && (
                        <span
                          className={`absolute -left-1 -top-1 h-3.5 w-3.5 rounded-full shadow-lg ${markerClass}`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
