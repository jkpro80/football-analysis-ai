"use client";

import { useRouter } from "next/navigation";

import { useLocale } from "@/context/locale-context";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  fallbackHref = "/",
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

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={resolvedLabel}
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 ${className}`}
    >
      <span aria-hidden="true">→</span>
      <span>{resolvedLabel}</span>
    </button>
  );
}

