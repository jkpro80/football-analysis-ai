"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/context/auth-context";
export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    isAuthenticated,
    isLoading,
  } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(
    false,
  );
  const [error, setError] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/profile");
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
  ]);
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        identifier,
        password,
      });
      router.replace("/profile");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تسجيل الدخول. حاول مرة أخرى.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-6 py-4 text-sm text-slate-400">
          جارٍ التحقق من الجلسة...
        </div>
      </main>
    );
  }
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] px-4 py-10 text-white"
    >
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section>
          <p className="text-sm font-black tracking-[0.22em] text-cyan-400">
            FOOTBALL ANALYSIS AI
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            سجل دخولك إلى منصة تحليل المباريات
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
            تابع توقعات المباريات، بيانات الفرق، نتائج
            التحليل، وخطة اشتراكك من حساب واحد.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5">
              <p className="text-sm font-bold text-cyan-300">
                توقعات ذكية
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                وصول مباشر إلى نتائج محرك التوقعات
                والتحليلات المتقدمة.
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
              <p className="text-sm font-bold text-emerald-300">
                حساب آمن
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                جلسة مستخدم محمية باستخدام Access Token
                وRefresh Token.
              </p>
            </article>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl sm:p-8">
          <div>
            <p className="text-sm font-bold text-cyan-400">
              تسجيل الدخول
            </p>
            <h2 className="mt-2 text-3xl font-black">
              مرحبًا بعودتك
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              استخدم بريدك الإلكتروني أو اسم المستخدم.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                البريد الإلكتروني أو اسم المستخدم
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                }}
                autoComplete="username"
                required
                minLength={3}
                maxLength={320}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                كلمة المرور
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                autoComplete="current-password"
                required
                maxLength={128}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-300"
              >
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                identifier.trim().length < 3 ||
                password.length === 0
              }
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "جارٍ تسجيل الدخول..."
                : "تسجيل الدخول"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="font-bold text-cyan-300 transition hover:text-cyan-200"
            >
              إنشاء حساب جديد
            </Link>
          </p>
          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <Link
              href="/"
              className="text-sm font-bold text-slate-400 transition hover:text-white"
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
