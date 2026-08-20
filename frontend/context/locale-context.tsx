"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
  localeDirections,
  type Locale,
} from "@/lib/i18n/config";

import {
  getMessages,
} from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  direction: "rtl" | "ltr";
  messages: ReturnType<typeof getMessages>;
  setLocale: (locale: Locale) => void;
};

const LocaleContext =
  createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  children: ReactNode;
  initialLocale?: Locale;
};

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: LocaleProviderProps) {
  const [locale, setLocaleState] =
    useState<Locale>(initialLocale);

  useEffect(() => {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) =>
        row.startsWith(`${localeCookieName}=`)
      )
      ?.split("=")[1];

    if (
      cookieLocale &&
      isSupportedLocale(cookieLocale) &&
      cookieLocale !== locale
    ) {
      setLocaleState(cookieLocale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir =
      localeDirections[locale];
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);

      document.cookie =
        `${localeCookieName}=${nextLocale}; ` +
        "Path=/; Max-Age=31536000; SameSite=Lax";
    },
    [],
  );

  const value = useMemo(
    () => ({
      locale,
      direction: localeDirections[locale],
      messages: getMessages(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error(
      "useLocale must be used inside LocaleProvider.",
    );
  }

  return context;
}
