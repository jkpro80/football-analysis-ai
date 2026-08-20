"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
} from "react";

import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [message, setMessage] =
    useState<string | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await forgotPassword({
        email,
      });

      setMessage(
        "إذا كان هناك حساب مرتبط بهذا البريد، فسيتم إرسال رابط لإعادة تعيين كلمة المرور.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر إرسال طلب الاستعادة. حاول مرة أخرى.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] px-4 py-10 text-white"
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="w-full rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl sm:p-8">
          <p className="text-sm font-black tracking-[0.22em] text-cyan-400">
            MALX
          </p>

          <h1 className="mt-3 text-3xl font-black">
            استعادة كلمة المرور
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا
            لإعادة تعيين كلمة المرور.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                البريد الإلكتروني
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                autoComplete="email"
                required
                maxLength={320}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>

            {message ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-sm leading-7 text-emerald-300"
              >
                {message}
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm leading-7 text-red-300"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                email.trim().length === 0
              }
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "جارٍ إرسال الرابط..."
                : "إرسال رابط الاستعادة"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-cyan-300 transition hover:text-cyan-200"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
