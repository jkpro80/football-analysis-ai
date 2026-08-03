export default function FixturesHeader() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-cyan-400">
            Fixtures Center
          </p>

          <h1 className="text-3xl font-bold text-white">
            المباريات
          </h1>

          <p className="mt-2 text-sm leading-7 text-slate-400 sm:text-base">
            متابعة المباريات القادمة والمباشرة والمنتهية مع الوصول إلى
            التحليلات والتوقعات.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            تحديث المباريات
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-5 py-2.5 font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
          >
            تصدير البيانات
          </button>
        </div>
      </div>
    </section>
  );
}