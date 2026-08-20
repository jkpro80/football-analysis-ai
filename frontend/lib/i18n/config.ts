export const supportedLocales = ["ar", "en", "sv"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export const localeCookieName = "malx_locale";

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
  sv: "Svenska",
};

export const localeDirections: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
  sv: "ltr",
};

export function isSupportedLocale(
  value: string | undefined | null,
): value is Locale {
  return supportedLocales.includes(value as Locale);
}
