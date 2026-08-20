"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/context/auth-context";
export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    isAuthenticated,
    isLoading,
  } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [acceptedLegal, setAcceptedLegal] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(
    false,
  );
  const [error, setError] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
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
    if (!acceptedLegal) {
      setError(
        "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية قبل إنشاء الحساب.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName,
        username,
        email,
        password,
        accepted_legal: acceptedLegal,
      });
      router.replace("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر إنشاء الحساب. حاول مرة أخرى.",
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
            أنشئ حسابك وابدأ تحليل المباريات
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
            احصل على حساب مجاني مرتبط تلقائيًا بخطة
            Free، ثم يمكنك لاحقًا الترقية إلى الخطة
            المناسبة.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5">
              <p className="text-sm font-bold text-cyan-300">
                تسجيل سريع
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                أنشئ حسابك خلال دقائق وابدأ باستخدام
                المنصة مباشرة.
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
              <p className="text-sm font-bold text-emerald-300">
                خطة مجانية
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                يتم ربط حسابك تلقائيًا بالخطة المجانية
                عند التسجيل.
              </p>
            </article>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl sm:p-8">
          <div>
            <p className="text-sm font-bold text-cyan-400">
              إنشاء حساب
            </p>
            <h2 className="mt-2 text-3xl font-black">
              ابدأ الآن
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              أدخل بياناتك لإنشاء حساب جديد.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                الاسم الكامل
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                }}
                autoComplete="name"
                required
                minLength={2}
                maxLength={200}
                placeholder="الاسم الكامل"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                اسم المستخدم
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                }}
                autoComplete="username"
                required
                minLength={3}
                maxLength={100}
                pattern="[A-Za-z0-9_.-]+"
                placeholder="username"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>
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
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
              <p className="mt-2 text-xs leading-6 text-slate-600">
                يجب أن تحتوي على حرف كبير، حرف صغير،
                ورقم واحد على الأقل.
              </p>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                تأكيد كلمة المرور
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                }}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => {
                  setAcceptedLegal(event.target.checked);
                }}
                required
                className="mt-1 h-4 w-4 accent-cyan-400"
              />

              <span className="text-sm leading-7 text-slate-400">
                أوافق على{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-bold text-cyan-300 hover:text-cyan-200"
                >
                  الشروط والأحكام
                </Link>
                {" "}و{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-bold text-cyan-300 hover:text-cyan-200"
                >
                  سياسة الخصوصية
                </Link>
                .
              </span>
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
                fullName.trim().length < 2 ||
                username.trim().length < 3 ||
                email.trim().length === 0 ||
                password.length < 8 ||
                confirmPassword.length < 8 ||
                !acceptedLegal
              }
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "جارٍ إنشاء الحساب..."
                : "إنشاء الحساب"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-bold text-cyan-300 transition hover:text-cyan-200"
            >
              تسجيل الدخول
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



