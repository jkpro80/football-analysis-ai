"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/context/locale-context";
import { useTheme } from "@/context/theme-context";

export default function ThemeToggle() {
  const { locale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = theme === "dark";

  const label = isDark
    ? (
        locale === "ar"
          ? "تفعيل الوضع النهاري"
          : locale === "sv"
            ? "Aktivera ljust läge"
            : "Enable light mode"
      )
    : (
        locale === "ar"
          ? "تفعيل الوضع الداكن"
          : locale === "sv"
            ? "Aktivera mörkt läge"
            : "Enable dark mode"
      );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-lg text-[var(--foreground)] shadow-sm transition hover:border-cyan-500 hover:text-cyan-500 sm:h-11 sm:w-11"
    >
      <span aria-hidden="true">
        {isMounted
          ? isDark
            ? "☀"
            : "☾"
          : "◐"}
      </span>
    </button>
  );
}
