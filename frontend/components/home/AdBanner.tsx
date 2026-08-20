"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

type AdBannerProps = {
  href?: string;
  imageUrl?: string;
  alt?: string;
};

export default function AdBanner({
  href = "#",
  imageUrl,
  alt,
}: AdBannerProps) {
  const { locale } = useLocale();

  if (!imageUrl) {
    return null;
  }

  const advertisementLabel =
    locale === "ar"
      ? "إعلان"
      : locale === "sv"
        ? "Annons"
        : "Advertisement";

  const imageAlt = alt ?? advertisementLabel;

  return (
    <section
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="mt-7"
    >
      <div className="mb-2 text-xs font-bold text-slate-500">
        {advertisementLabel}
      </div>

      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 transition hover:border-cyan-500/40"
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="h-auto w-full object-cover"
        />
      </Link>
    </section>
  );
}
