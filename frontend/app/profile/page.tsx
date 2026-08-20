"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import type { Locale } from "@/lib/i18n/config";

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

function getProfileText(locale: Locale) {
  if (locale === "ar") {
    return {
      loading: "جارٍ تحميل بيانات الحساب...",
      unavailable: "غير متوفر",

      eyebrow: "الملف الشخصي",
      title: "الملف الشخصي",
      description: "معلومات حسابك وخطة الاشتراك الحالية.",
      logout: "تسجيل الخروج",

      activeAccount: "الحساب نشط",
      inactiveAccount: "الحساب غير نشط",

      accountType: "نوع الحساب",
      admin: "مدير",
      regularUser: "مستخدم عادي",

      verification: "التحقق",
      verified: "موثق",
      unverified: "غير موثق",

      plan: "الخطة",
      currentPlan: "الخطة الحالية",
      subscriptionStatus: "حالة الاشتراك",
      active: "نشط",
      analysisLimit: "حد التحليلات",
      unlimited: "غير محدود",

      accountInformationEyebrow: "معلومات الحساب",
      accountInformation: "معلومات الحساب",
      fullName: "الاسم الكامل",
      username: "اسم المستخدم",
      email: "البريد الإلكتروني",
      joinedAt: "تاريخ الانضمام",

      favoritesEyebrow: "المفضلة",
      favoriteMatches: "المباريات المفضلة",

      subscriptionEyebrow: "الاشتراك",
      manageSubscription: "إدارة الاشتراك",

      settingsEyebrow: "الإعدادات",
      settings: "الإعدادات",
    };
  }

  if (locale === "sv") {
    return {
      loading: "Laddar kontoinformation...",
      unavailable: "Ej tillgängligt",

      eyebrow: "ANVÄNDARPROFIL",
      title: "Profil",
      description:
        "Information om ditt konto och din nuvarande prenumerationsplan.",
      logout: "Logga ut",

      activeAccount: "Kontot är aktivt",
      inactiveAccount: "Kontot är inaktivt",

      accountType: "Kontotyp",
      admin: "Administratör",
      regularUser: "Vanlig användare",

      verification: "Verifiering",
      verified: "Verifierad",
      unverified: "Inte verifierad",

      plan: "Plan",
      currentPlan: "Nuvarande plan",
      subscriptionStatus: "Prenumerationsstatus",
      active: "Aktiv",
      analysisLimit: "Analysgräns",
      unlimited: "Obegränsad",

      accountInformationEyebrow: "KONTOINFORMATION",
      accountInformation: "Kontoinformation",
      fullName: "Fullständigt namn",
      username: "Användarnamn",
      email: "E-post",
      joinedAt: "Registreringsdatum",

      favoritesEyebrow: "FAVORITER",
      favoriteMatches: "Favoritmatcher",

      subscriptionEyebrow: "PRENUMERATION",
      manageSubscription: "Hantera prenumeration",

      settingsEyebrow: "INSTÄLLNINGAR",
      settings: "Inställningar",
    };
  }

  return {
    loading: "Loading account information...",
    unavailable: "Not available",

    eyebrow: "USER PROFILE",
    title: "Profile",
    description:
      "Your account information and current subscription plan.",
    logout: "Log out",

    activeAccount: "Account active",
    inactiveAccount: "Account inactive",

    accountType: "Account type",
    admin: "Administrator",
    regularUser: "Regular user",

    verification: "Verification",
    verified: "Verified",
    unverified: "Not verified",

    plan: "Plan",
    currentPlan: "Current plan",
    subscriptionStatus: "Subscription status",
    active: "Active",
    analysisLimit: "Analysis limit",
    unlimited: "Unlimited",

    accountInformationEyebrow: "ACCOUNT INFORMATION",
    accountInformation: "Account information",
    fullName: "Full name",
    username: "Username",
    email: "Email",
    joinedAt: "Joined",

    favoritesEyebrow: "FAVORITES",
    favoriteMatches: "Favorite matches",

    subscriptionEyebrow: "SUBSCRIPTION",
    manageSubscription: "Manage subscription",

    settingsEyebrow: "SETTINGS",
    settings: "Settings",
  };
}

function formatDate(
  value: string,
  locale: Locale,
  unavailable: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return unavailable;
  }

  const dateLocale =
    locale === "ar"
      ? "ar-IQ"
      : locale === "sv"
        ? "sv-SE"
        : "en-US";

  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function ProfilePage() {
  const router = useRouter();
  const { locale, direction } = useLocale();
  const text = getProfileText(locale);

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
        dir={direction}
        className="flex min-h-screen items-center justify-center bg-[#020617] text-white"
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-6 py-4 text-slate-400">
          {text.loading}
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
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-cyan-500/25 bg-gradient-to-l from-cyan-950/20 to-violet-950/20 p-7 sm:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black tracking-[0.24em] text-cyan-400">
                {text.eyebrow}
              </p>

              <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                {text.title}
              </h1>

              <p className="mt-4 text-slate-400">
                {text.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-500/30 bg-red-950/20 px-5 py-3 font-bold text-red-300 transition hover:bg-red-950/40"
            >
              {text.logout}
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
                  ? text.activeAccount
                  : text.inactiveAccount}
              </span>
            </div>

            <div className="mt-7 space-y-4 border-t border-slate-800 pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  {text.accountType}
                </span>
                <strong>
                  {user.role === "admin"
                    ? text.admin
                    : text.regularUser}
                </strong>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  {text.verification}
                </span>
                <strong>
                  {user.is_verified
                    ? text.verified
                    : text.unverified}
                </strong>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  {text.plan}
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
                  {text.currentPlan}
                </p>
                <p className="mt-4 text-3xl font-black text-cyan-300">
                  {planName}
                </p>
              </article>

              <article className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-6">
                <p className="text-sm text-slate-500">
                  {text.subscriptionStatus}
                </p>
                <p className="mt-4 text-2xl font-black text-emerald-300">
                  {user.subscription?.status === "active"
                    ? text.active
                    : user.subscription?.status ?? text.active}
                </p>
              </article>

              <article className="rounded-3xl border border-violet-500/20 bg-violet-950/10 p-6">
                <p className="text-sm text-slate-500">
                  {text.analysisLimit}
                </p>
                <p className="mt-4 text-2xl font-black text-violet-300">
                  {plan?.analysis_limit ?? text.unlimited}
                </p>
              </article>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-950/65 p-7">
              <p className="text-sm font-black tracking-[0.2em] text-violet-400">
                {text.accountInformationEyebrow}
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {text.accountInformation}
              </h2>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    {text.fullName}
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {user.full_name}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    {text.username}
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {user.username}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    {text.email}
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {user.email}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-500">
                    {text.joinedAt}
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-[#071023] px-4 py-3">
                    {formatDate(
                      user.created_at,
                      locale,
                      text.unavailable,
                    )}
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
              {text.favoritesEyebrow}
            </p>
            <h3 className="mt-2 text-xl font-black">
              {text.favoriteMatches}
            </h3>
          </Link>

          <Link
            href="/subscription"
            className="rounded-3xl border border-amber-500/20 bg-amber-950/10 p-6 transition hover:border-amber-400/50"
          >
            <p className="text-sm font-bold text-amber-400">
              {text.subscriptionEyebrow}
            </p>
            <h3 className="mt-2 text-xl font-black">
              {text.manageSubscription}
            </h3>
          </Link>

          <Link
            href="/settings"
            className="rounded-3xl border border-cyan-500/20 bg-cyan-950/10 p-6 transition hover:border-cyan-400/50"
          >
            <p className="text-sm font-bold text-cyan-400">
              {text.settingsEyebrow}
            </p>
            <h3 className="mt-2 text-xl font-black">
              {text.settings}
            </h3>
          </Link>
        </section>
      </div>
    </main>
  );
}
