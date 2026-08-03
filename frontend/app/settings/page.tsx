"use client";

import { useEffect, useState } from "react";

type SettingsState = {
  language: "ar" | "en";
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
  language: "ar",
  timezone: "Asia/Baghdad",
  compactCards: false,
  showProbabilities: true,
  showConfidence: true,
  emailNotifications: false,
  liveNotifications: true,
  valueBetNotifications: true,
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<SettingsState>(defaultSettings);

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
        });
      }
    } catch {
      setSettings(defaultSettings);
    } finally {
      setIsReady(true);
    }
  }, []);

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
    setSettings(defaultSettings);

    window.localStorage.removeItem(STORAGE_KEY);

    setSaved(false);
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-l from-cyan-950/25 via-slate-950 to-blue-950/20 p-7 sm:p-10">
          <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
            SETTINGS CENTER
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            الإعدادات
          </h1>

          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            تخصيص اللغة والمنطقة الزمنية والإشعارات
            وطريقة عرض التوقعات داخل المنصة.
          </p>
        </header>

        {!isReady ? (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/50 p-8 text-slate-400">
            جارٍ تحميل الإعدادات...
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
                <p className="text-sm font-bold tracking-[0.2em] text-cyan-400">
                  GENERAL
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  الإعدادات العامة
                </h2>

                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">
                      اللغة
                    </span>

                    <select
                      value={settings.language}
                      onChange={(event) =>
                        updateSetting(
                          "language",
                          event.target.value as
                            | "ar"
                            | "en",
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-[#071023] px-4 py-3 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="ar">
                        العربية
                      </option>

                      <option value="en">
                        English
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">
                      المنطقة الزمنية
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
                        بغداد
                      </option>

                      <option value="Europe/Stockholm">
                        ستوكهولم
                      </option>

                      <option value="Europe/London">
                        لندن
                      </option>

                      <option value="America/New_York">
                        نيويورك
                      </option>
                    </select>
                  </label>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-800 bg-slate-950/60 p-7">
                <p className="text-sm font-bold tracking-[0.2em] text-violet-400">
                  DISPLAY
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  تفضيلات العرض
                </h2>

                <div className="mt-6 space-y-4">
                  <ToggleRow
                    title="البطاقات المضغوطة"
                    description="تقليل المسافات داخل بطاقات المباريات."
                    checked={settings.compactCards}
                    onChange={(value) =>
                      updateSetting(
                        "compactCards",
                        value,
                      )
                    }
                  />

                  <ToggleRow
                    title="إظهار الاحتمالات"
                    description="عرض نسب توقعات المحرك داخل البطاقات."
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
                    title="إظهار مستوى الثقة"
                    description="عرض تقييم الثقة لكل مباراة."
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
                NOTIFICATIONS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                الإشعارات
              </h2>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <ToggleRow
                  title="إشعارات البريد"
                  description="استقبال ملخصات عبر البريد الإلكتروني."
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
                  title="المباريات المباشرة"
                  description="تنبيه عند بدء مباراة محفوظة."
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
                  title="فرص القيمة"
                  description="تنبيه عند ظهور فرصة قوية جديدة."
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
                  حفظ التغييرات
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  تحفظ الإعدادات في هذا المتصفح حاليًا.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-black text-slate-300 transition hover:border-slate-500"
                >
                  استعادة الافتراضي
                </button>

                <button
                  type="button"
                  onClick={saveSettings}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                >
                  {saved
                    ? "تم الحفظ"
                    : "حفظ الإعدادات"}
                </button>
              </div>
            </section>
          </>
        )}

        <footer className="mt-14 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI — Settings Center
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