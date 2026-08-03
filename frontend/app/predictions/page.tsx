import MatchExplorer from "@/components/home/MatchExplorer";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const { fixtures } = await getDashboardData();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
            PREDICTIONS CENTER
          </p>

          <h1 className="mt-2 text-4xl font-black">
            مركز التوقعات
          </h1>

          <p className="mt-3 max-w-3xl text-slate-400">
            جميع المباريات مع إمكانية البحث،
            التصفية، والترتيب حسب الثقة أو أفضل
            اختيار أو التاريخ.
          </p>
        </header>

        <MatchExplorer fixtures={fixtures} />
      </div>
    </main>
  );
}