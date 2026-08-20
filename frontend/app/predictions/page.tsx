import MatchExplorer from "@/components/home/MatchExplorer";
import { getDashboardData } from "@/lib/dashboard";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeDirections } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const PREDICTIONS_PAGE_TEXT = {
  ar: {
    eyebrow: "مركز التوقعات",
    title: "مركز التوقعات",
    description:
      "جميع المباريات مع إمكانية البحث، التصفية، والترتيب حسب الثقة أو أفضل اختيار أو التاريخ.",
  },

  en: {
    eyebrow: "PREDICTIONS CENTER",
    title: "Predictions Center",
    description:
      "Browse all matches with search, filtering, and sorting by confidence, best pick, or date.",
  },

  sv: {
    eyebrow: "PROGNOSCENTER",
    title: "Prognoscenter",
    description:
      "Utforska alla matcher med sökning, filtrering och sortering efter säkerhet, bästa val eller datum.",
  },
} as const;

export default async function PredictionsPage() {
  const locale = await resolveRequestLocale();
  const direction = localeDirections[locale];
  const text = PREDICTIONS_PAGE_TEXT[locale];

  const { fixtures } = await getDashboardData();

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
            {text.eyebrow}
          </p>

          <h1 className="mt-2 text-4xl font-black">
            {text.title}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            {text.description}
          </p>
        </header>

        <MatchExplorer fixtures={fixtures} />
      </div>
    </main>
  );
}
