"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/context/locale-context";
import {
  localeNames,
  supportedLocales,
  type Locale,
} from "@/lib/i18n/config";

type SettingsState = {
  language: Locale;
  timezone: string;
  compactCards: boolean;
  showProbabilities: boolean;
  showConfidence: boolean;
  emailNotifications: boolean;
  liveNotifications: boolean;
  valueBetNotifications: boolean;
};

const STORAGE_KEY = "football-analysis-settings";

const defaultSettings: SettingsState = {
  language: "en",
  timezone: "Asia/Baghdad",
  compactCards: false,
  showProbabilities: true,
  showConfidence: true,
  emailNotifications: false,
  liveNotifications: true,
  valueBetNotifications: true,
};

function getSettingsText(locale: Locale) {
  if (locale === "ar") {
    return {
      eyebrow: "مركز الإعدادات",
      title: "الإعدادات",
      description:
        "تخصيص اللغة والمنطقة الزمنية والإشعارات وطريقة عرض التوقعات داخل المنصة.",
      loading: "جارٍ تحميل الإعدادات...",

      generalEyebrow: "عام",
      generalTitle: "الإعدادات العامة",
      language: "اللغة",
      timezone: "المنطقة الزمنية",

      baghdad: "بغداد",
      stockholm: "ستوكهولم",
      london: "لندن",
      newYork: "نيويورك",

      displayEyebrow: "العرض",
      displayTitle: "تفضيلات العرض",

      compactCards: "البطاقات المضغوطة",
      compactCardsDescription:
        "تقليل المسافات داخل بطاقات المباريات.",

      showProbabilities: "إظهار الاحتمالات",
      showProbabilitiesDescription:
        "عرض نسب توقعات المحرك داخل البطاقات.",

      showConfidence: "إظهار مستوى الثقة",
      showConfidenceDescription:
        "عرض تقييم الثقة لكل مباراة.",

      notificationsEyebrow: "الإشعارات",
      notificationsTitle: "الإشعارات",

      emailNotifications: "إشعارات البريد",
      emailNotificationsDescription:
        "استقبال ملخصات عبر البريد الإلكتروني.",

      liveNotifications: "المباريات المباشرة",
      liveNotificationsDescription:
        "تنبيه عند بدء مباراة محفوظة.",

      valueBetNotifications: "فرص القيمة",
      valueBetNotificationsDescription:
        "تنبيه عند ظهور فرصة قوية جديدة.",

      saveChanges: "حفظ التغييرات",
      saveDescription:
        "تحفظ الإعدادات في هذا المتصفح حاليًا.",
      reset: "استعادة الافتراضي",
      saved: "تم الحفظ",
      save: "حفظ الإعدادات",

      footer: "Football Analysis AI — مركز الإعدادات",
    };
  }

  if (locale === "sv") {
    return {
      eyebrow: "INSTÄLLNINGSCENTER",
      title: "Inställningar",
      description:
        "Anpassa språk, tidszon, aviseringar och hur prognoser visas på plattformen.",
      loading: "Laddar inställningar...",

      generalEyebrow: "ALLMÄNT",
      generalTitle: "Allmänna inställningar",
      language: "Språk",
      timezone: "Tidszon",

      baghdad: "Bagdad",
      stockholm: "Stockholm",
      london: "London",
      newYork: "New York",

      displayEyebrow: "VISNING",
      displayTitle: "Visningsinställningar",

      compactCards: "Kompakta kort",
      compactCardsDescription:
        "Minska mellanrummen i matchkorten.",

      showProbabilities: "Visa sannolikheter",
      showProbabilitiesDescription:
        "Visa motorns sannolikheter i korten.",

      showConfidence: "Visa säkerhetsnivå",
      showConfidenceDescription:
        "Visa säkerhetsbedömningen för varje match.",

      notificationsEyebrow: "AVISERINGAR",
      notificationsTitle: "Aviseringar",

      emailNotifications: "E-postaviseringar",
      emailNotificationsDescription:
        "Ta emot sammanfattningar via e-post.",

      liveNotifications: "Livematcher",
      liveNotificationsDescription:
        "Få en avisering när en sparad match börjar.",

      valueBetNotifications: "Värdemöjligheter",
      valueBetNotificationsDescription:
        "Få en avisering när en ny stark möjlighet visas.",

      saveChanges: "Spara ändringar",
      saveDescription:
        "Inställningarna sparas för närvarande i den här webbläsaren.",
      reset: "Återställ standard",
      saved: "Sparat",
      save: "Spara inställningar",

      footer: "Football Analysis AI — Inställningscenter",
    };
  }

  return {
    eyebrow: "SETTINGS CENTER",
    title: "Settings",
    description:
      "Customize language, timezone, notifications and how predictions are displayed across the platform.",
    loading: "Loading settings...",

    generalEyebrow: "GENERAL",
    generalTitle: "General Settings",
    language: "Language",
    timezone: "Timezone",

    baghdad: "Baghdad",
    stockholm: "Stockholm",
    london: "London",
    newYork: "New York",

    displayEyebrow: "DISPLAY",
    displayTitle: "Display Preferences",

    compactCards: "Compact Cards",
    compactCardsDescription:
      "Reduce spacing inside match cards.",

    showProbabilities: "Show Probabilities",
    showProbabilitiesDescription:
      "Show engine prediction probabilities inside cards.",

    showConfidence: "Show Confidence",
    showConfidenceDescription:
      "Show the confidence rating for each match.",

    notificationsEyebrow: "NOTIFICATIONS",
    notificationsTitle: "Notifications",

    emailNotifications: "Email Notifications",
    emailNotificationsDescription:
      "Receive summaries by email.",

    liveNotifications: "Live Matches",
    liveNotificationsDescription:
      "Get notified when a saved match starts.",

    valueBetNotifications: "Value Opportunities",
    valueBetNotificationsDescription:
      "Get notified when a new strong opportunity appears.",

    saveChanges: "Save Changes",
    saveDescription:
      "Settings are currently stored in this browser.",
    reset: "Reset to Default",
    saved: "Saved",
    save: "Save Settings",

    footer: "Football Analysis AI — Settings Center",
  };
}

export default function SettingsPage() {
  const {
    locale,
    direction,
    setLocale,
  } = useLocale();

  const text = getSettingsText(locale);

  const [settings, setSettings] =
    useState<SettingsState>({
      ...defaultSettings,
      language: locale,
    });

  const [isReady, setIsReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed =
          JSON.parse(stored) as Partial<SettingsState>;

        setSettings({
          ...defaultSettings,
          ...parsed,
          language: locale,
        });
      } else {
        setSettings({
          ...defaultSettings,
          language: locale,
        });
      }
    } catch {
      setSettings({
        ...defaultSettings,
        language: locale,
      });
    } finally {
      setIsReady(true);
    }
  }, [locale]);

  const updateSetting = <Key extends keyof SettingsState>(
    key: Key,
    value: SettingsState[Key],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const handleLanguageChange = (
    nextLocale: Locale,
  ) => {
    setLocale(nextLocale);

    setSettings((current) => ({
      ...current,
      language: nextLocale,
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings),
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const resetSettings = () => {
    const resetValue: SettingsState = {
      ...defaultSettings,
      language: locale,
    };

    setSettings(resetValue);

    window.localStorage.removeItem(STORAGE_KEY);

    setSaved(false);
  };

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-l from-cyan-950/25 via-slate-950 to-blue-950/20 p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
            {text.eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            {text.title}
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            {text.description}
          </p>
        </header>

        {!isReady ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
            {text.loading}
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
                <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
                  {text.generalEyebrow}
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {text.generalTitle}
                </h2>

                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">
                      {text.language}
                    </span>

                    <select
                      value={settings.language}
                      onChange={(event) =>
                        handleLanguageChange(
                          event.target.value as Locale,
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none focus:border-cyan-500"
                    >
                      {supportedLocales.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {localeNames[item]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">
                      {text.timezone}
                    </span>

                    <select
                      value={settings.timezone}
                      onChange={(event) =>
                        updateSetting(
                          "timezone",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="Asia/Baghdad">
                        {text.baghdad}
                      </option>

                      <option value="Europe/Stockholm">
                        {text.stockholm}
                      </option>

                      <option value="Europe/London">
                        {text.london}
                      </option>

                      <option value="America/New_York">
                        {text.newYork}
                      </option>
                    </select>
                  </label>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
                <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
                  {text.displayEyebrow}
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {text.displayTitle}
                </h2>

                <div className="mt-6 space-y-4">
                  <ToggleRow
                    title={text.compactCards}
                    description={
                      text.compactCardsDescription
                    }
                    checked={settings.compactCards}
                    onChange={(value) =>
                      updateSetting(
                        "compactCards",
                        value,
                      )
                    }
                  />

                  <ToggleRow
                    title={text.showProbabilities}
                    description={
                      text.showProbabilitiesDescription
                    }
                    checked={
                      settings.showProbabilities
                    }
                    onChange={(value) =>
                      updateSetting(
                        "showProbabilities",
                        value,
                      )
                    }
                  />

                  <ToggleRow
                    title={text.showConfidence}
                    description={
                      text.showConfidenceDescription
                    }
                    checked={settings.showConfidence}
                    onChange={(value) =>
                      updateSetting(
                        "showConfidence",
                        value,
                      )
                    }
                  />
                </div>
              </article>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
              <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
                {text.notificationsEyebrow}
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {text.notificationsTitle}
              </h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <ToggleRow
                  title={text.emailNotifications}
                  description={
                    text.emailNotificationsDescription
                  }
                  checked={
                    settings.emailNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "emailNotifications",
                      value,
                    )
                  }
                />

                <ToggleRow
                  title={text.liveNotifications}
                  description={
                    text.liveNotificationsDescription
                  }
                  checked={
                    settings.liveNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "liveNotifications",
                      value,
                    )
                  }
                />

                <ToggleRow
                  title={text.valueBetNotifications}
                  description={
                    text.valueBetNotificationsDescription
                  }
                  checked={
                    settings.valueBetNotifications
                  }
                  onChange={(value) =>
                    updateSetting(
                      "valueBetNotifications",
                      value,
                    )
                  }
                />
              </div>
            </section>

            <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
              <div>
                <h2 className="text-xl font-black">
                  {text.saveChanges}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {text.saveDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-black text-slate-300 transition hover:border-slate-500"
                >
                  {text.reset}
                </button>

                <button
                  type="button"
                  onClick={saveSettings}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                >
                  {saved
                    ? text.saved
                    : text.save}
                </button>
              </div>
            </section>
          </>
        )}

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          {text.footer}
        </footer>
      </div>
    </main>
  );
}

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#071023] p-4">
      <div>
        <p className="font-black text-white">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-5 w-5 accent-cyan-500"
      />
    </label>
  );
}
