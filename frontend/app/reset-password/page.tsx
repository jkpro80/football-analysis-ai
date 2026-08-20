"use client";

import Link from "next/link";
import {
  useSearchParams,
} from "next/navigation";
import {
  Suspense,
  useState,
  type FormEvent,
} from "react";

import { resetPassword } from "@/lib/auth-api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [success, setSuccess] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (!token) {
      setError(
        "رابط الاستعادة غير صالح أو لا يحتوي على رمز الاستعادة.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "كلمتا المرور غير متطابقتين.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        token,
        new_password: password,
      });

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تغيير كلمة المرور.",
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
            تعيين كلمة مرور جديدة
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            اختر كلمة مرور جديدة لحسابك.
          </p>

          {success ? (
            <div className="mt-8 space-y-5">
              <div
                role="status"
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-4 text-sm leading-7 text-emerald-300"
              >
                تم تغيير كلمة المرور بنجاح.
              </div>

              <Link
                href="/login"
                className="block w-full rounded-xl bg-cyan-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-cyan-300"
              >
                تسجيل الدخول
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  كلمة المرور الجديدة
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  تأكيد كلمة المرور
                </span>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value,
                    );
                  }}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </label>

              <p className="text-xs leading-6 text-slate-500">
                يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل،
                وحرف كبير، وحرف صغير، ورقم.
              </p>

              {!token ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm leading-7 text-red-300"
                >
                  رابط الاستعادة غير صالح.
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
                  !token ||
                  password.length < 8 ||
                  confirmPassword.length < 8
                }
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "جارٍ تغيير كلمة المرور..."
                  : "تغيير كلمة المرور"}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-400 transition hover:text-white"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="min-h-screen bg-[#020617] px-4 py-10 text-white"
        >
          <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
            <p className="text-sm text-slate-400">
              جارٍ تحميل رابط الاستعادة...
            </p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

