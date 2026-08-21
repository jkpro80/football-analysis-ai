"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";

type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

type SidebarProps = {
  mobile?: boolean;
};

export default function Sidebar({
  mobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const {
    locale,
    messages,
    direction,
  } = useLocale();

  const isAdmin = user?.role === "admin";

  const mainNavigation: NavigationItem[] = [
    {
      label: messages.common.home,
      href: "/",
      icon: "⌂",
    },
    {
      label: messages.common.fixtures,
      href: "/fixtures",
      icon: "⚽",
    },
    {
      label:
        locale === "ar"
          ? "المباريات المباشرة"
          : locale === "sv"
            ? "Live-matcher"
            : "Live matches",
      href: "/live",
      icon: "●",
      badge: "Live",
    },
    {
      label: messages.common.predictions,
      href: "/predictions",
      icon: "◉",
    },
    {
      label:
        locale === "ar"
          ? "أفضل الفرص"
          : locale === "sv"
            ? "Bästa möjligheter"
            : "Best opportunities",
      href: "/value-bets",
      icon: "★",
    },
  ];

  const exploreNavigation: NavigationItem[] = [
    {
      label: messages.common.leagues,
      href: "/leagues",
      icon: "🏆",
    },
    {
      label: messages.common.teams,
      href: "/teams",
      icon: "♟",
    },
    {
      label: messages.common.statistics,
      href: "/statistics",
      icon: "▥",
    },
    {
      label: messages.common.favorites,
      href: "/favorites",
      icon: "♡",
    },
  ];

  const accountNavigation: NavigationItem[] = [
    {
      label: messages.common.subscription,
      href: "/subscription",
      icon: "◆",
    },
    {
      label:
        locale === "ar"
          ? "حسابي"
          : locale === "sv"
            ? "Mitt konto"
            : "My account",
      href: "/profile",
      icon: "👤",
    },
    {
      label: messages.common.settings,
      href: "/settings",
      icon: "⚙",
    },
  ];

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const homeGroupTitle =
    messages.common.home;

  const exploreGroupTitle =
    locale === "ar"
      ? "الاستكشاف"
      : locale === "sv"
        ? "Utforska"
        : "Explore";

  const accountGroupTitle =
    locale === "ar"
      ? "الحساب"
      : locale === "sv"
        ? "Konto"
        : "Account";

  const adminLabel =
    locale === "ar"
      ? "دخول لوحة الإدارة"
      : locale === "sv"
        ? "Öppna adminpanelen"
        : "Open admin panel";

  return (
    <aside
      dir={direction}
      className={[
        "h-screen shrink-0 bg-slate-950/95",
        mobile
          ? "flex w-full flex-col"
          : "hidden w-56 lg:sticky lg:top-0 lg:flex lg:flex-col",
        direction === "rtl"
          ? "border-l border-slate-800"
          : "border-r border-slate-800",
      ].join(" ")}
    >
      <div className="border-b border-slate-800 px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
            FA
          </div>

          <div>
            <h1 className="font-bold text-white">
              Football Analysis
            </h1>

            <p className="mt-0.5 text-xs text-slate-500">
              Intelligence Platform
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <NavigationGroup
          title={homeGroupTitle}
          items={mainNavigation}
          isActive={isActive}
        />

        <NavigationGroup
          title={exploreGroupTitle}
          items={exploreNavigation}
          isActive={isActive}
        />

        <NavigationGroup
          title={accountGroupTitle}
          items={accountNavigation}
          isActive={isActive}
        />
      </nav>

      <div className="border-t border-slate-800 p-4">
        {isAdmin ? (
          <Link
            href="/admin"
            className="mt-3 flex items-center justify-center rounded-xl border border-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            {adminLabel}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function NavigationGroup({
  title,
  items,
  isActive,
}: {
  title: string;
  items: NavigationItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="mb-7">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const active =
            isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition",
                active
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-lg text-base",
                    active
                      ? "bg-slate-950/10"
                      : "bg-slate-900 text-slate-300 group-hover:bg-slate-800",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                {item.label}
              </span>

              {item.badge ? (
                <span
                  className={[
                    "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                    active
                      ? "bg-slate-950/15 text-slate-950"
                      : "bg-red-500/15 text-red-400",
                  ].join(" ")}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

