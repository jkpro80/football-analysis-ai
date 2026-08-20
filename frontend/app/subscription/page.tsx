"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";
import {
  cancelSubscription,
  changeSubscription,
  createCheckout,
  getSubscriptionPlans,
  getSubscriptionUsage,
  type SubscriptionPlan,
  type SubscriptionUsage,
} from "@/lib/auth-api";

function getText(locale: Locale) {
  if (locale === "ar") {
    return {
      eyebrow: "مركز الاشتراكات",
      title: "الاشتراكات",
      description:
        "اختر الخطة المناسبة لك واستفد من المزيد من تحليلات Football Analysis AI.",
      currentPlan: "خطتك الحالية",
      loginToViewPlan: "سجل الدخول لعرض خطتك الحالية",

      usagePlan: "الخطة الحالية",
      used: "التحليلات المستخدمة",
      remaining: "المتبقي",
      unlimited: "غير محدود",
      reset: "إعادة التصفير",

      loading: "جارٍ تحميل خطط الاشتراك...",
      loadError: "تعذر تحميل خطط الاشتراك.",

      freePrice: "مجانًا",
      monthly: "شهريًا",

      currentBadge: "خطتك الحالية",
      currentButton: "الخطة الحالية",

      cancelling: "جارٍ إلغاء الاشتراك...",
      cancel: "إلغاء الاشتراك",

      processing: "جارٍ المعالجة...",
      choosePlan: "اختيار الخطة",
      upgradeTo: (name: string) =>
        `الترقية إلى ${name}`,
      createAccount: "إنشاء حساب",

      legalPrefix:
        "قبل الاشتراك المدفوع، أؤكد أنني قرأت ووافقت على",
      subscriptionTermsLink:
        "شروط الاشتراك والإلغاء",
      legalAnd: "و",
      generalTermsLink:
        "الشروط والأحكام",
      immediateAccess:
        "وأطلب بدء الوصول إلى الخدمة فور إتمام الدفع. أفهم أن بدء الخدمة قد يؤثر على حق الانسحاب وفق القانون المطبق، دون المساس بحقوقي القانونية الإلزامية.",
      legalRequired:
        "يجب الموافقة على شروط الاشتراك والشروط والأحكام قبل المتابعة إلى الدفع.",

      updateSuccess: (name: string) =>
        `تم تحديث الاشتراك إلى ${name}.`,
      changeError: "تعذر تغيير الاشتراك.",
      cancelSuccess:
        "تم إيقاف التجديد التلقائي. ستبقى خطتك فعالة حتى نهاية الفترة المدفوعة الحالية.",
      cancelError: "تعذر إلغاء الاشتراك.",

      systemStatus: "حالة نظام الاشتراكات",
      systemStatusDescription:
        "الخطط والأسعار المعروضة في هذه الصفحة تأتي الآن مباشرة من قاعدة البيانات. عملية الدفع والترقية وإدارة الاشتراك مرتبطة بمنظومة الاشتراكات الحالية.",

      profile: "الملف الشخصي",
      home: "الرئيسية",
    };
  }

  if (locale === "sv") {
    return {
      eyebrow: "ABONNEMANGSCENTER",
      title: "Abonnemang",
      description:
        "Välj den plan som passar dig och få tillgång till fler analyser i Football Analysis AI.",
      currentPlan: "Din nuvarande plan",
      loginToViewPlan:
        "Logga in för att se din nuvarande plan",

      usagePlan: "Nuvarande plan",
      used: "Använda analyser",
      remaining: "Återstående",
      unlimited: "Obegränsat",
      reset: "Återställs",

      loading: "Laddar abonnemangsplaner...",
      loadError:
        "Det gick inte att ladda abonnemangsplanerna.",

      freePrice: "Gratis",
      monthly: "per månad",

      currentBadge: "Din nuvarande plan",
      currentButton: "Nuvarande plan",

      cancelling: "Avslutar...",
      cancel: "Avsluta abonnemang",

      processing: "Bearbetar...",
      choosePlan: "Välj plan",
      upgradeTo: (name: string) =>
        `Uppgradera till ${name}`,
      createAccount: "Skapa konto",

      legalPrefix:
        "Innan jag tecknar ett betalt abonnemang bekräftar jag att jag har läst och godkänt",
      subscriptionTermsLink:
        "villkoren för abonnemang och uppsägning",
      legalAnd: "och",
      generalTermsLink:
        "de allmänna villkoren",
      immediateAccess:
        "och jag begär att tjänsten börjar tillhandahållas direkt efter betalningen. Jag förstår att detta kan påverka min ångerrätt enligt tillämplig lag, utan att begränsa tvingande konsumenträttigheter.",
      legalRequired:
        "Du måste godkänna abonnemangsvillkoren och de allmänna villkoren innan du går vidare till betalning.",

      updateSuccess: (name: string) =>
        `Abonnemanget har uppdaterats till ${name}.`,
      changeError:
        "Det gick inte att ändra abonnemanget.",
      cancelSuccess:
        "Automatisk förnyelse har stoppats. Din plan förblir aktiv till slutet av den nuvarande betalda perioden.",
      cancelError:
        "Det gick inte att avsluta abonnemanget.",

      systemStatus: "Abonnemangssystemets status",
      systemStatusDescription:
        "Planerna och priserna på den här sidan hämtas direkt från databasen. Betalning, uppgradering och abonnemangshantering är kopplade till det nuvarande abonnemangssystemet.",

      profile: "Profil",
      home: "Hem",
    };
  }

  return {
    eyebrow: "SUBSCRIPTION CENTER",
    title: "Subscriptions",
    description:
      "Choose the plan that suits you and get access to more Football Analysis AI features.",
    currentPlan: "Your current plan",
    loginToViewPlan:
      "Log in to view your current plan",

    usagePlan: "Current Plan",
    used: "Analyses Used",
    remaining: "Remaining",
    unlimited: "Unlimited",
    reset: "Resets",

    loading: "Loading subscription plans...",
    loadError:
      "Unable to load subscription plans.",

    freePrice: "Free",
    monthly: "per month",

    currentBadge: "Your Current Plan",
    currentButton: "Current Plan",

    cancelling: "Cancelling...",
    cancel: "Cancel Subscription",

    processing: "Processing...",
    choosePlan: "Choose Plan",
    upgradeTo: (name: string) =>
      `Upgrade to ${name}`,
    createAccount: "Create Account",

    legalPrefix:
      "Before purchasing a paid subscription, I confirm that I have read and agree to the",
    subscriptionTermsLink:
      "Subscription & Cancellation Terms",
    legalAnd: "and",
    generalTermsLink:
      "Terms & Conditions",
    immediateAccess:
      "and I request immediate access to the service after payment. I understand that commencement of the service may affect statutory withdrawal rights under applicable law, without limiting mandatory consumer rights.",
    legalRequired:
      "You must accept the Subscription Terms and Terms & Conditions before continuing to payment.",

    updateSuccess: (name: string) =>
      `Subscription updated to ${name}.`,
    changeError:
      "Unable to change subscription.",
    cancelSuccess:
      "Automatic renewal has been stopped. Your plan will remain active until the end of the current paid period.",
    cancelError:
      "Unable to cancel subscription.",

    systemStatus: "Subscription System Status",
    systemStatusDescription:
      "Plans and prices shown on this page are loaded directly from the database. Payments, upgrades and subscription management are connected to the current subscription system.",

    profile: "Profile",
    home: "Home",
  };
}

function formatPrice(
  plan: SubscriptionPlan,
): string {
  if (Number(plan.monthly_price) === 0) {
    return "$0";
  }

  return `${Number(plan.monthly_price).toFixed(2)} ${plan.currency}`;
}

function getPlanDescription(
  code: string,
  locale: Locale,
): string {
  if (locale === "sv") {
    if (code === "free") {
      return "Grundläggande fotbollsanalys för att komma igång med plattformen.";
    }

    if (code === "pro") {
      return "Fullständiga prognoser och avancerad analys för mer krävande användare.";
    }

    if (code === "premium") {
      return "Avancerad tillgång för professionella användare med alla analysfunktioner.";
    }

    return "Abonnemangsplan för Football Analysis AI.";
  }

  if (locale === "en") {
    if (code === "free") {
      return "Basic football analysis access to get started with the platform.";
    }

    if (code === "pro") {
      return "Full predictions and advanced analysis for more demanding users.";
    }

    if (code === "premium") {
      return "Advanced access for professional users with all analysis features.";
    }

    return "Subscription plan for Football Analysis AI.";
  }

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
  locale: Locale,
): string[] {
  if (locale === "sv") {
    if (plan.code === "free") {
      return [
        "Grundläggande prognoser",
        "Matchcenter",
        "Grundläggande statistik",
        `Upp till ${plan.analysis_limit ?? 10} analyser`,
      ];
    }

    if (plan.code === "pro") {
      return [
        "Alla funktioner i Free",
        "Avancerade analyser",
        "xG, form och H2H",
        "Hörnor och kort",
        "BTTS och Över / Under",
        "Obegränsade analyser",
      ];
    }

    return [
      "Alla funktioner i Pro",
      "Högsta analysnivån",
      "Full tillgång till avancerade marknader",
      "Prioriterad tillgång till nya funktioner",
      "Obegränsade analyser",
    ];
  }

  if (locale === "en") {
    if (plan.code === "free") {
      return [
        "Basic predictions",
        "Match Center",
        "Basic statistics",
        `Up to ${plan.analysis_limit ?? 10} analyses`,
      ];
    }

    if (plan.code === "pro") {
      return [
        "All Free features",
        "Advanced analysis",
        "xG, Form and H2H",
        "Corners and cards",
        "BTTS and Over / Under",
        "Unlimited analyses",
      ];
    }

    return [
      "All Pro features",
      "Highest level of analysis",
      "Full access to advanced markets",
      "Priority access to new features",
      "Unlimited analyses",
    ];
  }

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

  const { locale, direction } = useLocale();
  const text = getText(locale);

  const [plans, setPlans] =
    useState<SubscriptionPlan[]>([]);

  const [usage, setUsage] =
    useState<SubscriptionUsage | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [changingPlan, setChangingPlan] =
    useState<string | null>(null);

  const [
    cancellingSubscription,
    setCancellingSubscription,
  ] = useState(false);

  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [
    acceptedSubscriptionTerms,
    setAcceptedSubscriptionTerms,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      try {
        const result =
          await getSubscriptionPlans();

        if (active) {
          setPlans(result);
        }
      } catch {
        if (active) {
          setError(text.loadError);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      active = false;
    };
  }, [text.loadError]);

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

    void loadUsage();

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

  const dateLocale =
    locale === "ar"
      ? "ar"
      : locale === "sv"
        ? "sv-SE"
        : "en-US";

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

    if (
      Number(plan.monthly_price) > 0 &&
      !acceptedSubscriptionTerms
    ) {
      setActionMessage(text.legalRequired);
      return;
    }

    setChangingPlan(plan.code);
    setActionMessage(null);
    setError(null);

    try {
      if (Number(plan.monthly_price) > 0) {
        const origin =
          window.location.origin;

        const checkout =
          await createCheckout(
            accessToken,
            plan.code,
            `${origin}/billing/success`,
            `${origin}/billing/cancel`,
            acceptedSubscriptionTerms,
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
        text.updateSuccess(plan.name),
      );
    } catch {
      setActionMessage(
        text.changeError,
      );
    } finally {
      setChangingPlan(null);
    }
  }

  async function handleCancelSubscription():
    Promise<void> {
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
      await cancelSubscription(
        accessToken,
      );

      await reloadUser();

      setActionMessage(
        text.cancelSuccess,
      );
    } catch {
      setActionMessage(
        text.cancelError,
      );
    } finally {
      setCancellingSubscription(false);
    }
  }

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-amber-500/20 bg-gradient-to-l from-amber-950/10 to-cyan-950/10 p-7 sm:p-10">
          <p className="text-sm font-black tracking-[0.24em] text-amber-400">
            {text.eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            {text.title}
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            {text.description}
          </p>

          {!authLoading && user ? (
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/10 px-4 py-3">
              <span className="text-sm text-slate-400">
                {text.currentPlan}:
              </span>

              <strong className="text-cyan-300">
                {currentPlan?.name ??
                  user.subscription?.plan
                    ?.name ??
                  "Free"}
              </strong>
            </div>
          ) : (
            <div className="mt-6">
              <Link
                href="/login"
                className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
              >
                {text.loginToViewPlan}
              </Link>
            </div>
          )}
        </header>

        {user && usage ? (
          <section className="mt-8 grid gap-4 md:grid-cols-4">
            <UsageCard
              label={text.usagePlan}
              value={usage.plan.toUpperCase()}
              valueClass="text-cyan-300"
            />

            <UsageCard
              label={text.used}
              value={usage.used}
            />

            <UsageCard
              label={text.remaining}
              value={
                usage.remaining === null
                  ? text.unlimited
                  : usage.remaining
              }
              valueClass="text-emerald-300"
            />

            <UsageCard
              label={text.reset}
              value={new Date(
                usage.reset_at,
              ).toLocaleDateString(
                dateLocale,
              )}
              small
            />
          </section>
        ) : null}

        {isLoading ? (
          <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/65 p-8 text-center text-slate-400">
            {text.loading}
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

        {user && !isLoading && !error ? (
          <section className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedSubscriptionTerms}
                onChange={(event) => {
                  setAcceptedSubscriptionTerms(
                    event.target.checked,
                  );
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-amber-400"
              />

              <span className="text-sm leading-7 text-slate-400">
                {text.legalPrefix}{" "}

                <Link
                  href="/subscription-terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-300 hover:text-amber-200"
                >
                  {text.subscriptionTermsLink}
                </Link>

                {" "}{text.legalAnd}{" "}

                <Link
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-300 hover:text-amber-200"
                >
                  {text.generalTermsLink}
                </Link>

                . {text.immediateAccess}
              </span>
            </label>
          </section>
        ) : null}

        {!isLoading && !error ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent =
                plan.code ===
                currentPlanCode;

              const isFree =
                Number(
                  plan.monthly_price,
                ) === 0;

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
                      {text.currentBadge}
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
                        ? text.freePrice
                        : text.monthly}
                    </p>

                    <p className="mt-5 min-h-[56px] leading-7 text-slate-400">
                      {getPlanDescription(
                        plan.code,
                        locale,
                      )}
                    </p>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3">
                    {getFeatures(
                      plan,
                      locale,
                    ).map((feature) => (
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
                    ))}
                  </ul>

                  {isCurrent ? (
                    <>
                      <button
                        type="button"
                        disabled
                        className="mt-7 w-full cursor-default rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-5 py-3 font-black text-cyan-300"
                      >
                        {text.currentButton}
                      </button>

                      {!isFree ? (
                        <button
                          type="button"
                          onClick={
                            handleCancelSubscription
                          }
                          disabled={
                            cancellingSubscription
                          }
                          className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-950/20 px-5 py-3 font-black text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingSubscription
                            ? text.cancelling
                            : text.cancel}
                        </button>
                      ) : null}
                    </>
                  ) : user ? (
                    <button
                      type="button"
                      onClick={() =>
                        handlePlanChange(
                          plan,
                        )
                      }
                      disabled={
                        changingPlan !== null
                      }
                      className="mt-7 w-full rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {changingPlan ===
                      plan.code
                        ? text.processing
                        : isFree
                          ? text.choosePlan
                          : text.upgradeTo(
                              plan.name,
                            )}
                    </button>
                  ) : (
                    <Link
                      href="/register"
                      className="mt-7 block w-full rounded-xl bg-cyan-400 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      {text.createAccount}
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
            {text.systemStatus}
          </h2>

          <p className="mt-3 leading-7 text-slate-500">
            {text.systemStatusDescription}
          </p>
        </section>

        <footer className="mt-10 flex flex-wrap gap-4 border-t border-slate-800 py-7">
          <Link
            href="/profile"
            className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:border-slate-500"
          >
            {text.profile}
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:border-slate-500"
          >
            {text.home}
          </Link>
        </footer>
      </div>
    </main>
  );
}

function UsageCard({
  label,
  value,
  valueClass = "",
  small = false,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-black ${
          small
            ? "text-sm text-slate-300"
            : `text-2xl ${valueClass}`
        }`}
      >
        {value}
      </p>
    </div>
  );
}


