"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocale } from "@/context/locale-context";

type BackButtonProps = {
  fallbackHref?: string;
  preferredHref?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  fallbackHref = "/",
  preferredHref,
  label,
  className = "",
}: BackButtonProps) {
  const router = useRouter();
  const { locale } = useLocale();

  const resolvedLabel =
    label ??
    (locale === "sv"
      ? "Tillbaka"
      : locale === "en"
        ? "Back"
        : "رجوع");

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  const sharedClassName =
    `group inline-flex min-h-10 touch-manipulation select-none items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3.5 py-2 text-sm font-semibold text-slate-300 transition-all duration-100 hover:border-cyan-400/70 hover:bg-slate-800/80 hover:text-cyan-300 active:scale-[0.97] ${className}`;

  if (preferredHref) {
    return (
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
            return;
          }

          router.replace(preferredHref);
        }}
        aria-label={resolvedLabel}
        className={sharedClassName}
      >
        <span aria-hidden="true">
          {locale === "ar" ? "→" : "←"}
        </span>
        <span>{resolvedLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={resolvedLabel}
      className={sharedClassName}
    >
      <span aria-hidden="true">
        {locale === "ar" ? "→" : "←"}
      </span>
      <span>{resolvedLabel}</span>
    </button>
  );
}

