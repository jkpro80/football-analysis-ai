import {
  cookies,
  headers,
} from "next/headers";

import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName,
  type Locale,
} from "./config";

const arabCountries = new Set([
  "AE",
  "BH",
  "DZ",
  "DJ",
  "EG",
  "IQ",
  "JO",
  "KM",
  "KW",
  "LB",
  "LY",
  "MA",
  "MR",
  "OM",
  "PS",
  "QA",
  "SA",
  "SD",
  "SO",
  "SY",
  "TN",
  "YE",
]);

function localeFromCountry(
  countryCode: string | null,
): Locale | null {
  if (!countryCode) {
    return null;
  }

  const country =
    countryCode.trim().toUpperCase();

  if (country === "SE") {
    return "sv";
  }

  if (arabCountries.has(country)) {
    return "ar";
  }

  return "en";
}

function localeFromAcceptLanguage(
  acceptLanguage: string | null,
): Locale | null {
  if (!acceptLanguage) {
    return null;
  }

  const languages = acceptLanguage
    .split(",")
    .map((part) =>
      part.trim().split(";")[0]?.toLowerCase(),
    )
    .filter(Boolean);

  for (const language of languages) {
    const baseLanguage =
      language?.split("-")[0];

    if (isSupportedLocale(baseLanguage)) {
      return baseLanguage;
    }
  }

  return null;
}

export async function resolveRequestLocale():
  Promise<Locale> {
  const cookieStore = await cookies();

  const savedLocale =
    cookieStore.get(localeCookieName)?.value;

  if (isSupportedLocale(savedLocale)) {
    return savedLocale;
  }

  const requestHeaders = await headers();

  const countryCode =
    requestHeaders.get("cf-ipcountry") ??
    requestHeaders.get("x-vercel-ip-country") ??
    requestHeaders.get("cloudfront-viewer-country") ??
    requestHeaders.get("x-country-code");

  const countryLocale =
    localeFromCountry(countryCode);

  if (countryLocale) {
    return countryLocale;
  }

  const browserLocale =
    localeFromAcceptLanguage(
      requestHeaders.get("accept-language"),
    );

  return browserLocale ?? defaultLocale;
}
