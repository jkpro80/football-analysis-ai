import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const accountStats = [
    {
      label: "المباريات المفضلة",
      value: "0",
      helper: "محفوظة في هذا المتصفح",
      valueClassName: "text-pink-300",
    },
    {
      label: "الخطة الحالية",
      value: "Free",
      helper: "الخطة المجانية",
      valueClassName: "text-cyan-300",
    },
    {
      label: "حالة الحساب",
      value: "نشط",
      helper: "يمكنك استخدام المنصة",
      valueClassName: "text-emerald-300",
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-l from-cyan-950/25 via-slate-950 to-violet-950/20 p-7 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
                USER PROFILE
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                الملف الشخصي
              </h1>

              <p className="mt-4 max-w-3xl leading-8 text-slate-400">
                إدارة معلومات الحساب، مراجعة الخطة الحالية،
                والوصول إلى إعدادات المستخدم.
              </p>
            </div>

            <Link
              href="/settings"
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 font-black text-cyan-300 transition hover:bg-cyan-500/20"
            >
              إعدادات الحساب
            </Link>
          </div>
        </header>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_1.9fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-3xl font-black text-cyan-300">
                FA
              </div>

              <h2 className="mt-5 text-2xl font-black">
                مستخدم Football Analysis
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                user@football-analysis.local
              </p>

              <span className="mt-4 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-300">
                الحساب نشط
              </span>
            </div>

            <div className="mt-7 space-y-3 border-t border-slate-800 pt-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  نوع الحساب
                </span>

                <strong className="text-white">
                  مستخدم عادي
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  اللغة
                </span>

                <strong className="text-white">
                  العربية
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  المنطقة الزمنية
                </span>

                <strong className="text-white">
                  Asia/Baghdad
                </strong>
              </div>
            </div>
          </article>

          <section className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-3">
              {accountStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6"
                >
                  <p className="text-sm font-bold text-slate-500">
                    {stat.label}
                  </p>

                  <p
                    className={`mt-3 text-3xl font-black ${stat.valueClassName}`}
                  >
                    {stat.value}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {stat.helper}
                  </p>
                </article>
              ))}
            </div>

            <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
              <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
                ACCOUNT INFORMATION
              </p>

              <h2 className="mt-2 text-2xl font-black">
                معلومات الحساب
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">
                    الاسم
                  </span>

                  <input
                    type="text"
                    defaultValue="مستخدم Football Analysis"
                    readOnly
                    className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">
                    البريد الإلكتروني
                  </span>

                  <input
                    type="email"
                    defaultValue="user@football-analysis.local"
                    readOnly
                    className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">
                    البلد
                  </span>

                  <input
                    type="text"
                    defaultValue="العراق"
                    readOnly
                    className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">
                    تاريخ الانضمام
                  </span>

                  <input
                    type="text"
                    defaultValue="سيتم ربطه بنظام الحسابات"
                    readOnly
                    className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-500">
                هذه الصفحة جاهزة للربط لاحقًا بنظام تسجيل
                الدخول وقاعدة بيانات المستخدمين.
              </p>
            </article>
          </section>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <Link
            href="/favorites"
            className="rounded-3xl border border-pink-500/20 bg-pink-950/10 p-6 transition hover:border-pink-400/40"
          >
            <p className="text-sm font-bold text-pink-400">
              FAVORITES
            </p>

            <h3 className="mt-2 text-xl font-black">
              المباريات المفضلة
            </h3>

            <p className="mt-3 leading-7 text-slate-500">
              مراجعة المباريات التي أضفتها إلى المفضلة.
            </p>
          </Link>

          <Link
            href="/subscription"
            className="rounded-3xl border border-amber-500/20 bg-amber-950/10 p-6 transition hover:border-amber-400/40"
          >
            <p className="text-sm font-bold text-amber-400">
              SUBSCRIPTION
            </p>

            <h3 className="mt-2 text-xl font-black">
              إدارة الاشتراك
            </h3>

            <p className="mt-3 leading-7 text-slate-500">
              عرض الخطط والميزات المتاحة في المنصة.
            </p>
          </Link>

          <Link
            href="/settings"
            className="rounded-3xl border border-cyan-500/20 bg-cyan-950/10 p-6 transition hover:border-cyan-400/40"
          >
            <p className="text-sm font-bold text-cyan-400">
              SETTINGS
            </p>

            <h3 className="mt-2 text-xl font-black">
              الإعدادات
            </h3>

            <p className="mt-3 leading-7 text-slate-500">
              تخصيص الإشعارات واللغة وتفضيلات العرض.
            </p>
          </Link>
        </section>

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI — Profile Center
        </footer>
      </div>
    </main>
  );
}