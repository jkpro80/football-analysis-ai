"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  cancelSubscription,
  changeSubscription,
  createCheckout,
  getSubscriptionPlans,
  getSubscriptionUsage,
  type SubscriptionPlan,
  type SubscriptionUsage,
} from "@/lib/auth-api";
function formatPrice(plan: SubscriptionPlan): string {
  if (Number(plan.monthly_price) === 0) {
    return "$0";
  }
  return `${Number(plan.monthly_price).toFixed(2)} ${plan.currency}`;
}
function getPlanDescription(
  code: string,
): string {
  if (code === "free") {
    return "خطة مجانية لتجربة المنصة والوصول إلى التحليلات الأساسية.";
  }
  if (code === "pro") {
    return "خطة متقدمة للمستخدم الذي يريد وصولاً أوسع إلى التحليلات والتوقعات.";
  }
  if (code === "premium") {
    return "الخطة الأعلى للمستخدم الذي يريد جميع الميزات والتحليلات المتقدمة.";
  }
  return "خطة اشتراك للوصول إلى ميزات Football Analysis AI.";
}
function getFeatures(
  plan: SubscriptionPlan,
): string[] {
  if (plan.code === "free") {
    return [
      "التوقعات الأساسية",
      "مركز المباريات",
      "الإحصائيات الأساسية",
      `حتى ${plan.analysis_limit ?? 10} تحليلات`,
    ];
  }
  if (plan.code === "pro") {
    return [
      "كل ميزات الخطة المجانية",
      "تحليلات متقدمة",
      "xG وForm وH2H",
      "ركنيات وبطاقات",
      "BTTS وOver / Under",
      "تحليلات غير محدودة",
    ];
  }
  return [
    "كل ميزات Pro",
    "أعلى مستوى من التحليلات",
    "وصول كامل للأسواق المتقدمة",
    "أولوية في الميزات الجديدة",
    "تحليلات غير محدودة",
  ];
}
export default function SubscriptionPage() {
  const {
    user,
    isLoading: authLoading,
    reloadUser,
  } = useAuth();
  const [plans, setPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [usage, setUsage] =
    useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [changingPlan, setChangingPlan] =
    useState<string | null>(null);
const [cancellingSubscription, setCancellingSubscription] =
  useState(false);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function loadPlans() {
      try {
        const result =
          await getSubscriptionPlans();
        if (active) {
          setPlans(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "تعذر تحميل خطط الاشتراك.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    loadPlans();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!user) {
      setUsage(null);
      return;
    }
    const accessToken =
      window.localStorage.getItem(
        "football_ai_access_token",
      );
    if (!accessToken) {
      setUsage(null);
      return;
    }
    let active = true;
    async function loadUsage() {
      try {
        const result =
          await getSubscriptionUsage(
            accessToken!,
          );
        if (active) {
          setUsage(result);
        }
      } catch {
        if (active) {
          setUsage(null);
        }
      }
    }
    loadUsage();
    return () => {
      active = false;
    };
  }, [user]);
  const currentPlanCode =
    user?.subscription?.plan?.code ?? null;
  const currentPlan = useMemo(
    () =>
      plans.find(
        (plan) =>
          plan.code === currentPlanCode,
      ) ?? null,
    [plans, currentPlanCode],
  );
  async function handlePlanChange(
    plan: SubscriptionPlan,
  ): Promise<void> {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const accessToken =
      window.localStorage.getItem(
        "football_ai_access_token",
      );
    if (!accessToken) {
      window.location.href = "/login";
      return;
    }
    setChangingPlan(plan.code);
    setActionMessage(null);
    setError(null);
    try {
    if (Number(plan.monthly_price) > 0) {
      const origin = window.location.origin;

      const checkout = await createCheckout(
        accessToken,
        plan.code,
        `${origin}/billing/success`,
        `${origin}/billing/cancel`,
      );

      window.location.assign(
        checkout.checkout_url,
      );

      return;
    }

    await changeSubscription(
      accessToken,
      plan.code,
    );

    await reloadUser();

    setActionMessage(
      `تم تحديث الاشتراك إلى ${plan.name}.`,
    );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر تغيير الاشتراك.";
      setActionMessage(message);
    } finally {
      setChangingPlan(null);
    }
  }

  async function handleCancelSubscription(): Promise<void> {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const accessToken =
      window.localStorage.getItem(
        "football_ai_access_token",
      );

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setCancellingSubscription(true);
    setActionMessage(null);
    setError(null);

    try {
      await cancelSubscription(accessToken);

      await reloadUser();

      setActionMessage(
        "تم إيقاف التجديد التلقائي. ستبقى خطتك فعالة حتى نهاية الفترة المدفوعة الحالية.",
      );
    } catch (caughtError) {
      setActionMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "تعذر إلغاء الاشتراك.",
      );
    } finally {
      setCancellingSubscription(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-amber-500/20 bg-gradient-to-l from-amber-950/10 to-cyan-950/10 p-7 sm:p-10">
          <p className="text-sm font-black tracking-[0.24em] text-amber-400">
            SUBSCRIPTION CENTER
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            الاشتراكات
          </h1>
          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            اختر الخطة المناسبة لك واستفد من المزيد من
            تحليلات Football Analysis AI.
          </p>
          {!authLoading && user ? (
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/10 px-4 py-3">
              <span className="text-sm text-slate-400">
                خطتك الحالية:
              </span>
              <strong className="text-cyan-300">
                {currentPlan?.name ??
                  user.subscription?.plan?.name ??
                  "Free"}
              </strong>
            </div>
          ) : (
            <div className="mt-6">
              <Link
                href="/login"
                className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
              >
                سجل الدخول لعرض خطتك الحالية
              </Link>
            </div>
          )}
        </header>
        {user && usage ? (
          <section className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
              <p className="text-sm text-slate-500">
                الخطة الحالية
              </p>
              <p className="mt-2 text-2xl font-black text-cyan-300">
                {usage.plan.toUpperCase()}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
              <p className="text-sm text-slate-500">
                التحليلات المستخدمة
              </p>
              <p className="mt-2 text-2xl font-black">
                {usage.used}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
              <p className="text-sm text-slate-500">
                المتبقي
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-300">
                {usage.remaining === null
                  ? "غير محدود"
                  : usage.remaining}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
              <p className="text-sm text-slate-500">
                إعادة التصفير
              </p>
              <p className="mt-2 text-sm font-bold text-slate-300">
                {new Date(
                  usage.reset_at,
                ).toLocaleDateString("ar")}
              </p>
            </div>
          </section>
        ) : null}
        {isLoading ? (
          <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/65 p-8 text-center text-slate-400">
            جارٍ تحميل خطط الاشتراك...
          </section>
        ) : null}
        {error ? (
          <section
            role="alert"
            className="mt-8 rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-red-300"
          >
            {error}
          </section>
        ) : null}
        {!isLoading && !error ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent =
                plan.code === currentPlanCode;
              const isFree =
                Number(plan.monthly_price) === 0;
              return (
                <article
                  key={plan.id}
                  className={`relative flex min-h-[520px] flex-col rounded-3xl border bg-slate-950/65 p-7 ${
                    isCurrent
                      ? "border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.12)]"
                      : "border-slate-800"
                  }`}
                >
                  {isCurrent ? (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">
                      خطتك الحالية
                    </span>
                  ) : null}
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-cyan-300">
                      {plan.name}
                    </h2>
                    <p className="mt-4 text-5xl font-black">
                      {formatPrice(plan)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {isFree
                        ? "مجانًا"
                        : "شهريًا"}
                    </p>
                    <p className="mt-5 min-h-[56px] leading-7 text-slate-400">
                      {plan.description ??
                        getPlanDescription(
                          plan.code,
                        )}
                    </p>
                  </div>
                  <ul className="mt-8 flex-1 space-y-3">
                    {getFeatures(plan).map(
                      (feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-7 text-slate-300"
                        >
                          <span className="text-emerald-400">
                            ✓
                          </span>
                          <span>
                            {feature}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                  {isCurrent ? (
                    <>
                      <button
                        type="button"
                        disabled
                        className="mt-7 w-full cursor-default rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-5 py-3 font-black text-cyan-300"
                      >
                        الخطة الحالية
                      </button>
                      {!isFree ? (
                        <button
                          type="button"
                          onClick={handleCancelSubscription}
                          disabled={cancellingSubscription}
                          className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-950/20 px-5 py-3 font-black text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingSubscription
                            ? "جارٍ إلغاء الاشتراك..."
                            : "إلغاء الاشتراك"}
                        </button>
                      ) : null}
                    </>
                  ) : user ? (
                    <button
                      type="button"
                      onClick={() =>
                        handlePlanChange(plan)
                      }
                      disabled={
                        changingPlan !== null
                      }
                      className="mt-7 w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {changingPlan === plan.code
                        ? "جارٍ المعالجة..."
                        : isFree
                          ? "اختيار الخطة"
                          : `الترقية إلى ${plan.name}`}
                    </button>
                  ) : (
                    <Link
                      href="/register"
                      className="mt-7 block w-full rounded-xl bg-cyan-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      إنشاء حساب
                    </Link>
                  )}
                </article>
              );
            })}
          </section>
        ) : null}
        {actionMessage ? (
          <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 px-5 py-4 text-sm text-cyan-200">
            {actionMessage}
          </div>
        ) : null}

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/65 p-7">
          <h2 className="text-2xl font-black">
            حالة نظام الاشتراكات
          </h2>
          <p className="mt-3 leading-7 text-slate-500">
            الخطط والأسعار المعروضة في هذه الصفحة
            تأتي الآن مباشرة من قاعدة البيانات.
            عملية الدفع والترقية وإدارة الاشتراك
            مرتبطة بمنظومة الاشتراكات الحالية.
          </p>
        </section>
        <footer className="mt-10 flex flex-wrap gap-4 border-t border-slate-800 py-7">
          <Link
            href="/profile"
            className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:border-slate-500"
          >
            الملف الشخصي
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:border-slate-500"
          >
            الرئيسية
          </Link>
        </footer>
      </div>
    </main>
  );
}










