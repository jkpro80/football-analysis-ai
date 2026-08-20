import type { Locale } from "./config";

export const messages = {
  ar: {
    common: {
      home: "الرئيسية",
      fixtures: "المباريات",
      live: "مباشر",
      predictions: "التوقعات",
      statistics: "الإحصائيات",
      leagues: "الدوريات",
      teams: "الفرق",
      favorites: "المفضلة",
      settings: "الإعدادات",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      register: "إنشاء حساب",
      profile: "الملف الشخصي",
      subscription: "الاشتراك",
      language: "اللغة",
      arabic: "العربية",
      english: "الإنجليزية",
      swedish: "السويدية",
    },
  },

  en: {
    common: {
      home: "Home",
      fixtures: "Fixtures",
      live: "Live",
      predictions: "Predictions",
      statistics: "Statistics",
      leagues: "Leagues",
      teams: "Teams",
      favorites: "Favorites",
      settings: "Settings",
      login: "Log in",
      logout: "Log out",
      register: "Create account",
      profile: "Profile",
      subscription: "Subscription",
      language: "Language",
      arabic: "Arabic",
      english: "English",
      swedish: "Swedish",
    },
  },

  sv: {
    common: {
      home: "Hem",
      fixtures: "Matcher",
      live: "Live",
      predictions: "Prognoser",
      statistics: "Statistik",
      leagues: "Ligor",
      teams: "Lag",
      favorites: "Favoriter",
      settings: "Inställningar",
      login: "Logga in",
      logout: "Logga ut",
      register: "Skapa konto",
      profile: "Profil",
      subscription: "Prenumeration",
      language: "Språk",
      arabic: "Arabiska",
      english: "Engelska",
      swedish: "Svenska",
    },
  },
} as const;

export type Messages = (typeof messages)["en"];

export function getMessages(locale: Locale) {
  return messages[locale];
}
