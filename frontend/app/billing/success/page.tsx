"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  getMySubscription,
  reconcilePayment,
  type UserSubscription,
} from "@/lib/auth-api";
function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const {
    accessToken,
    isLoading: authLoading,
    reloadUser,
  } = useAuth();
  const [subscription, setSubscription] =
    useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!accessToken) {
      setLoading(false);
      setError(
        "تم الدفع، ولكن يجب تسجيل الدخول لعرض حالة الاشتراك."
      );
      return;
    }
    let active = true;
    async function loadSubscription() {
      try {
        const paymentIdRaw =
          searchParams.get("payment_id");
        if (paymentIdRaw) {
          const paymentId = Number(paymentIdRaw);
          if (
            Number.isInteger(paymentId) &&
            paymentId > 0
          ) {
            await reconcilePayment(
              accessToken!,
              paymentId,
            );
          }
        }
        await reloadUser();
        const result =
          await getMySubscription(accessToken!);
        if (active) {
          setSubscription(result);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "تعذر التحقق من الاشتراك."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadSubscription();
    return () => {
      active = false;
    };
  }, [
    accessToken,
    authLoading,
    reloadUser,
    searchParams,
  ]);
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-emerald-500/20 bg-slate-950/70 p-8 text-center shadow-2xl sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-4xl text-emerald-400">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-black sm:text-4xl">
            تم الدفع بنجاح
          </h1>
          <p className="mt-4 leading-8 text-slate-400">
            شكرًا لك. تم استلام عملية الدفع وجارٍ
            التحقق من حالة اشتراكك.
          </p>
          {loading ? (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-slate-400">
              جارٍ تحديث الاشتراك...
            </div>
          ) : null}
          {!loading && subscription ? (
            <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6">
              <p className="text-sm text-slate-400">
                خطتك الحالية
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-300">
                {subscription.plan.name}
              </p>
              <p className="mt-3 text-sm text-slate-400">
                الحالة:{" "}
                <span className="font-bold text-emerald-300">
                  {subscription.status}
                </span>
              </p>
            </div>
          ) : null}
          {!loading && error ? (
            <div
              role="alert"
              className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5 text-amber-300"
            >
              {error}
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/subscription"
              className="rounded-xl bg-cyan-400 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-300"
            >
              عرض الاشتراك
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500"
            >
              الرئيسية
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="min-h-screen bg-slate-950 text-white"
        >
          <div className="mx-auto max-w-3xl px-6 py-20">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl">
              <div className="text-slate-400">
                جارٍ التحقق من عملية الدفع...
              </div>
            </section>
          </div>
        </main>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}