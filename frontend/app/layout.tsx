import type { Metadata } from "next";
import type { ReactNode } from "react";

import GlobalBackButton from "@/components/GlobalBackButton";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";
import {
  localeDirections,
} from "@/lib/i18n/config";
import {
  resolveRequestLocale,
} from "@/lib/i18n/server";

import "./globals.css";

export const metadata: Metadata = {
  title: "Football Analysis AI",
  description:
    "Commercial football analysis and prediction platform",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({
  children,
}: RootLayoutProps) {
  const locale =
    await resolveRequestLocale();

  const direction =
    localeDirections[locale];

  return (
    <html
      lang={locale}
      dir={direction}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>
            <GlobalBackButton />
            {children}
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
