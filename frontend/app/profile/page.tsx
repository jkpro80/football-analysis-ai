"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "FA";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "غير متوفر";
  }
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
  } = useAuth();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);
  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#020617] text-white"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-6 py-4 text-slate-400">
          جارٍ تحميل بيانات الحساب...
        </div>
      </main>
    );
  }
  if (!user) {
    return null;
  }
  const plan = user.subscription?.plan;
  const planName = plan?.name ?? "Free";
  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-500/25 bg-gradient-to-l from-cyan-950/20 to-violet-950/20 p-7 sm:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black tracking-[0.24em] text-cyan-400">
                USER PROFILE
              </p>
              <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                الملف الشخصي
              </h1>
              <p className="mt-4 text-slate-400">
                معلومات حسابك وخطة الاشتراك الحالية.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-500/30 bg-red-950/20 px-5 py-3 font-bold text-red-300 transition hover:bg-red-950/40"
            >
              تسجيل الخروج
            </button>
          </div>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-950/65 p-7">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-950/30 text-4xl font-black text-cyan-300">
                {getInitials(user.full_name)}
              </div>
              <h2 className="mt-6 text-2xl font-black">
                {user.full_name}
              </h2>
              <p className="mt-2 text-slate-500">
                @{user.username}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {user.email}
              </p>
              <span
                className={`mt-5 rounded-full border px-4 py-2 text-sm font-bold ${
                  user.is_active
                    ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                    : "border-red-500/30 bg-red-950/20 text-red-300"
                }`}
              >
                {user.is_active
                  ? "الحساب نشط"
                  : "الحساب غير نشط"}
              </span>
            </div>
            <div className="mt-7 space-y-4 border-t border-slate-800 pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  نوع الحساب
                </span>
                <strong>
                  {user.role === "admin"
                    ? "مدير"
                    : "مستخدم عادي"}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  التحقق
                </span>
                <strong>
                  {user.is_verified
                    ? "موثق"
                    : "غير موثق"}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  الخطة
                </span>
                <strong className="text-cyan-300">
                  {planName}
                </strong>
              </div>
            </div>
          </aside>
          <div className="space-y-6">
            <section className="grid gap-5 sm:grid-cols-3">
              <article className="rounded-3xl border border-cyan-500/20 bg-cyan-950/10 p-6">
                <p className="text-sm text-slate-500">
                  الخطة الحالية
                </p>
                <p className="mt-4 text-3xl font-black text-cyan-300">
                  {planName}
                </p>
              </article>
              <article className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-6">
                <p className="text-sm text-slate-500">
                  حالة الاشتراك
                </p>
                <p className="mt-4 text-2xl font-black text-emerald-300">
                  {user.subscription?.status === "active"
                    ? "نشط"
                    : user.subscription?.status ?? "نشط"}
                </p>
              </article>
              <article className="rounded-3xl border border-violet-500/20 bg-violet-950/10 p-6">
                <p className="text-sm text-slate-500">
                  حد التحليلات
                </p>
                <p className="mt-4 text-2xl font-black text-violet-300">
                  {plan?.analysis_limit ?? "غير محدود"}
                </p>
              </article>
            </section>
            <section className="rounded-3xl border border-slate-800 bg-slate-950/65 p-7">
              <p className="text-sm font-black tracking-[0.2em] text-violet-400">
                ACCOUNT INFORMATION
              </p>
              <h2 className="mt-3 text-2xl font-black">
                معلومات الحساب
              </h2>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    الاسم الكامل
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {user.full_name}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    اسم المستخدم
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {user.username}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    البريد الإلكتروني
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {user.email}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    تاريخ الانضمام
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/favorites"
            className="rounded-3xl border border-pink-500/20 bg-pink-950/10 p-6 transition hover:border-pink-400/50"
          >
            <p className="text-sm font-bold text-pink-400">
              FAVORITES
            </p>
            <h3 className="mt-2 text-xl font-black">
              المباريات المفضلة
            </h3>
          </Link>
          <Link
            href="/subscription"
            className="rounded-3xl border border-amber-500/20 bg-amber-950/10 p-6 transition hover:border-amber-400/50"
          >
            <p className="text-sm font-bold text-amber-400">
              SUBSCRIPTION
            </p>
            <h3 className="mt-2 text-xl font-black">
              إدارة الاشتراك
            </h3>
          </Link>
          <Link
            href="/settings"
            className="rounded-3xl border border-cyan-500/20 bg-cyan-950/10 p-6 transition hover:border-cyan-400/50"
          >
            <p className="text-sm font-bold text-cyan-400">
              SETTINGS
            </p>
            <h3 className="mt-2 text-xl font-black">
              الإعدادات
            </h3>
          </Link>
        </section>
      </div>
    </main>
  );
}
