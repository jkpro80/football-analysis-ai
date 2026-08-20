"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

const LEGAL_TEXT = {
  ar: {
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    cookies: "سياسة ملفات الارتباط",
    subscription: "شروط الاشتراك والإلغاء",
    contact: "التواصل القانوني",
  },
  en: {
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    cookies: "Cookie Policy",
    subscription: "Subscription & Cancellation",
    contact: "Legal Contact",
  },
  sv: {
    privacy: "Integritetspolicy",
    terms: "Villkor",
    cookies: "Cookiepolicy",
    subscription: "Abonnemang & uppsägning",
    contact: "Juridisk kontakt",
  },
} as const;

export default function LegalFooter() {
  const { locale, direction } = useLocale();
  const text = LEGAL_TEXT[locale];

  return (
    <footer
      dir={direction}
      className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-sm text-slate-500"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <nav className="flex flex-wrap gap-x-5 gap-y-3">
          <Link href="/privacy" className="transition hover:text-cyan-300">
            {text.privacy}
          </Link>

          <Link href="/terms" className="transition hover:text-cyan-300">
            {text.terms}
          </Link>

          <Link href="/cookies" className="transition hover:text-cyan-300">
            {text.cookies}
          </Link>

          <Link
            href="/subscription-terms"
            className="transition hover:text-cyan-300"
          >
            {text.subscription}
          </Link>
        </nav>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>© {new Date().getFullYear()} MALX LTD</span>

          <span>
            {text.contact}:{" "}
            <a
              href="mailto:support@malx.com"
              className="text-slate-400 transition hover:text-cyan-300"
            >
              support@malx.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
