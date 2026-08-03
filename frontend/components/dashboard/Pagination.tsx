type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  visibleItems: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  visibleItems,
  onPageChange,
}: Props) {
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-center text-xs text-slate-500">
        عرض {visibleItems} من {totalItems} توقعًا
      </p>
    );
  }

  return (
    <>
      <nav
        aria-label="التنقل بين صفحات التوقعات"
        className="mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.max(1, currentPage - 1),
            )
          }
          disabled={currentPage === 1}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          السابق
        </button>

        {Array.from(
          { length: totalPages },
          (_, index) => index + 1,
        ).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() =>
              onPageChange(pageNumber)
            }
            aria-current={
              currentPage === pageNumber
                ? "page"
                : undefined
            }
            className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-bold transition ${
              currentPage === pageNumber
                ? "border-cyan-500 bg-cyan-500 text-slate-950"
                : "border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-300"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.min(
                totalPages,
                currentPage + 1,
              ),
            )
          }
          disabled={
            currentPage === totalPages
          }
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          التالي
        </button>
      </nav>

      <p className="mt-4 text-center text-xs text-slate-500">
        الصفحة {currentPage} من {totalPages}
        {" — "}
        عرض {visibleItems} من {totalItems} توقعًا
      </p>
    </>
  );
}