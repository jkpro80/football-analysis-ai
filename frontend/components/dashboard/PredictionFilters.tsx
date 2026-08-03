type Props = {
  search: string;
  onSearchChange: (value: string) => void;

  confidenceFilter: string;
  onConfidenceChange: (value: string) => void;

  marketFilter: string;
  onMarketChange: (value: string) => void;

  includeLowConfidence: boolean;
  onIncludeLowConfidenceChange: (
    value: boolean,
  ) => void;

  resultCount: number;
};

export default function PredictionFilters({
  search,
  onSearchChange,
  confidenceFilter,
  onConfidenceChange,
  marketFilter,
  onMarketChange,
  includeLowConfidence,
  onIncludeLowConfidenceChange,
  resultCount,
}: Props) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label
            htmlFor="team-search"
            className="mb-2 block text-xs font-semibold text-slate-400"
          >
            البحث باسم الفريق
          </label>

          <input
            id="team-search"
            type="search"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="اكتب اسم الفريق..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="confidence-filter"
            className="mb-2 block text-xs font-semibold text-slate-400"
          >
            مستوى الثقة
          </label>

          <select
            id="confidence-filter"
            value={confidenceFilter}
            onChange={(event) =>
              onConfidenceChange(
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
          >
            <option value="all">
              جميع المستويات
            </option>

            <option value="very_high">
              عالية جدًا
            </option>

            <option value="high">
              عالية
            </option>

            <option value="medium">
              متوسطة
            </option>

            <option value="low">
              منخفضة
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="market-filter"
            className="mb-2 block text-xs font-semibold text-slate-400"
          >
            نوع أفضل توقع
          </label>

          <select
            id="market-filter"
            value={marketFilter}
            onChange={(event) =>
              onMarketChange(
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
          >
            <option value="all">
              جميع الاختيارات
            </option>

            <option value="home_win">
              فوز صاحب الأرض
            </option>

            <option value="draw">
              تعادل
            </option>

            <option value="away_win">
              فوز الفريق الضيف
            </option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={includeLowConfidence}
            onChange={(event) =>
              onIncludeLowConfidenceChange(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-cyan-500"
          />

          عرض التوقعات منخفضة الثقة
        </label>

        <p className="text-sm text-slate-400">
          عدد النتائج:
          {" "}
          <span className="font-bold text-cyan-300">
            {resultCount}
          </span>
        </p>
      </div>
    </section>
  );
}