import type { Metadata } from "next";
import type { ReactNode } from "react";

import GlobalBackButton from "@/components/GlobalBackButton";
import LegalFooter from "@/components/layout/LegalFooter";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";
import { ThemeProvider } from "@/context/theme-context";
import {
  localeDirections,
} from "@/lib/i18n/config";
import {
  resolveRequestLocale,
} from "@/lib/i18n/server";

import "./globals.css";

const themeInitializationScript = `
  (function () {
    try {
      var storedTheme = localStorage.getItem("malx-theme");
      var theme = storedTheme === "light" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://målx.com"),

  title: {
    default: "MÅLX | Football Predictions & Analytics",
    template: "%s | MÅLX",
  },

  description:
    "MÅLX provides football predictions, match analysis, probabilities, statistics, fixtures and data-driven insights.",

  applicationName: "MÅLX",

  openGraph: {
    type: "website",
    siteName: "MÅLX",
    title: "MÅLX | Football Predictions & Analytics",
    description:
      "Football predictions, match analysis, probabilities, statistics and data-driven insights.",
  },

  twitter: {
    card: "summary_large_image",
    title: "MÅLX | Football Predictions & Analytics",
    description:
      "Football predictions, match analysis, probabilities, statistics and data-driven insights.",
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.ico",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          id="malx-theme-initializer"
          dangerouslySetInnerHTML={{
            __html: themeInitializationScript,
          }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
          <AuthProvider>
            <GlobalBackButton />
            {children}
            <LegalFooter />
          </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
