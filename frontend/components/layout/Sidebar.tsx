"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

const mainNavigation: NavigationItem[] = [
  {
    label: "الرئيسية",
    href: "/",
    icon: "⌂",
  },
  {
    label: "المباريات",
    href: "/fixtures",
    icon: "⚽",
  },
  {
    label: "المباريات المباشرة",
    href: "/live",
    icon: "●",
    badge: "Live",
  },
  {
    label: "التوقعات",
    href: "/predictions",
    icon: "◉",
  },
  {
    label: "أفضل الفرص",
    href: "/value-bets",
    icon: "★",
  },
];

const exploreNavigation: NavigationItem[] = [
  {
    label: "الدوريات",
    href: "/leagues",
    icon: "🏆",
  },
  {
    label: "الفرق",
    href: "/teams",
    icon: "♟",
  },
  {
    label: "الإحصائيات",
    href: "/statistics",
    icon: "▥",
  },
  {
    label: "المفضلة",
    href: "/favorites",
    icon: "♡",
  },
];

const accountNavigation: NavigationItem[] = [
  {
    label: "الاشتراك",
    href: "/subscription",
    icon: "◆",
  },
  {
    label: "حسابي",
    href: "/profile",
    icon: "👤",
  },
  {
    label: "الإعدادات",
    href: "/settings",
    icon: "⚙",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      dir="rtl"
      className="hidden h-screen w-64 shrink-0 border-l border-slate-800 bg-slate-950/95 lg:sticky lg:top-0 lg:flex lg:flex-col"
    >
      <div className="border-b border-slate-800 px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
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
          title="الرئيسية"
          items={mainNavigation}
          isActive={isActive}
        />

        <NavigationGroup
          title="الاستكشاف"
          items={exploreNavigation}
          isActive={isActive}
        />

        <NavigationGroup
          title="الحساب"
          items={accountNavigation}
          isActive={isActive}
        />
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cyan-300">
              Prediction Engine
            </span>

            <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-xs font-semibold text-cyan-300">
              Active
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            الإصدار الحالي للمحرك
          </p>

          <p className="mt-1 font-bold text-white">
            Prediction V11 11.0.1
          </p>
        </div>

        <Link
          href="/admin"
          className="mt-3 flex items-center justify-center rounded-xl border border-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
        >
          دخول لوحة الإدارة
        </Link>
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
          const active = isActive(item.href);

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
