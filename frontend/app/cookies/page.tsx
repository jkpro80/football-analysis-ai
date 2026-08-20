"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

const CONTENT = {
  ar: {
    title: "سياسة ملفات الارتباط",
    updated: "آخر تحديث: 20 أغسطس 2026",
    intro:
      "توضح هذه السياسة كيفية استخدام MALX LTD لملفات الارتباط والتقنيات المشابهة عند استخدام منصة MALX.",
    sections: [
      {
        title: "1. ما هي ملفات الارتباط",
        body:
          "ملفات الارتباط هي ملفات نصية صغيرة قد يتم تخزينها على جهازك عند زيارة موقع إلكتروني. تساعد بعض ملفات الارتباط على تشغيل الموقع بصورة صحيحة، بينما قد تستخدم أنواع أخرى لفهم الاستخدام أو تحسين الخدمة.",
      },
      {
        title: "2. ملفات الارتباط الضرورية",
        body:
          "قد تستخدم MALX ملفات ارتباط أو تقنيات تخزين ضرورية لتسجيل الدخول، الحفاظ على الجلسة، الأمان، تفضيلات اللغة، الحماية من إساءة الاستخدام، وتشغيل الوظائف الأساسية للموقع. هذه التقنيات ضرورية لتقديم الخدمة ولا تتطلب عادةً موافقة عندما تكون لازمة بشكل صارم لتشغيل الخدمة التي طلبها المستخدم.",
      },
      {
        title: "3. التحليلات",
        body:
          "إذا قمنا مستقبلًا باستخدام أدوات تحليل غير ضرورية لفهم كيفية استخدام الزوار للموقع، فسنقدم المعلومات المناسبة ونطلب الموافقة عندما يكون ذلك مطلوبًا قانونيًا قبل تشغيل هذه التقنيات.",
      },
      {
        title: "4. الإعلانات والتتبع",
        body:
          "لا ينبغي تشغيل ملفات ارتباط أو تقنيات تتبع غير ضرورية لأغراض الإعلانات أو التسويق أو إنشاء ملفات تعريف المستخدمين قبل الحصول على الموافقة المطلوبة قانونيًا. إذا أضفنا هذه التقنيات مستقبلًا فسيتم تحديث هذه السياسة وآلية إدارة الموافقة.",
      },
      {
        title: "5. التخزين المحلي",
        body:
          "قد تستخدم MALX خصائص التخزين المحلي في المتصفح لحفظ معلومات تشغيلية مثل تفضيلات المستخدم أو رموز الجلسة أو اختيارات المفضلة عند الحاجة لتشغيل المنصة. تخضع هذه التقنيات أيضًا لقواعد الخصوصية والاتصالات الإلكترونية المعمول بها عندما تنطبق.",
      },
      {
        title: "6. ملفات ارتباط الأطراف الثالثة",
        body:
          "قد تستخدم خدمات خارجية ضرورية لتقديم بعض وظائف MALX تقنياتها الخاصة وفقًا لسياساتها، مثل خدمات الدفع أو البنية التحتية أو الحماية الأمنية. سنسعى إلى تقييد استخدام هذه الخدمات بما يلزم لتقديم المنصة.",
      },
      {
        title: "7. مدة الاحتفاظ",
        body:
          "قد تكون بعض ملفات الارتباط مؤقتة وتنتهي عند إغلاق المتصفح، بينما قد تبقى أخرى لفترة محددة. تعتمد مدة الاحتفاظ على الغرض من التقنية المستخدمة ومتطلبات تشغيل الخدمة.",
      },
      {
        title: "8. إدارة ملفات الارتباط",
        body:
          "يمكنك إدارة أو حذف ملفات الارتباط من إعدادات المتصفح. وقد يؤدي تعطيل بعض ملفات الارتباط الضرورية إلى عدم عمل أجزاء من MALX بصورة صحيحة.",
      },
      {
        title: "9. تحديث هذه السياسة",
        body:
          "قد نقوم بتحديث سياسة ملفات الارتباط عندما نغير التقنيات المستخدمة أو عندما تتغير المتطلبات القانونية. سيتم نشر النسخة المحدثة على هذه الصفحة.",
      },
      {
        title: "10. التواصل",
        body:
          "للاستفسارات المتعلقة بملفات الارتباط أو الخصوصية، تواصل مع MALX LTD عبر support@malx.com.",
      },
    ],
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    home: "العودة للرئيسية",
  },

  en: {
    title: "Cookie Policy",
    updated: "Last updated: 20 August 2026",
    intro:
      "This Cookie Policy explains how MALX LTD uses cookies and similar technologies when you use the MALX platform.",
    sections: [
      {
        title: "1. What cookies are",
        body:
          "Cookies are small text files that may be stored on your device when you visit a website. Some cookies are used to make a website function correctly, while others may be used to understand usage or improve the service.",
      },
      {
        title: "2. Strictly necessary technologies",
        body:
          "MALX may use cookies or similar storage technologies that are necessary for login, session management, security, language preferences, abuse prevention and other core platform functionality. These technologies are required to provide the service and generally do not require consent where they are strictly necessary to deliver a service requested by the user.",
      },
      {
        title: "3. Analytics",
        body:
          "If we introduce non-essential analytics technologies in the future to understand how visitors use the platform, we will provide appropriate information and request consent where legally required before activating them.",
      },
      {
        title: "4. Advertising and tracking",
        body:
          "Non-essential cookies or tracking technologies for advertising, marketing or user profiling should not be activated before legally required consent has been obtained. If such technologies are introduced in the future, this policy and our consent controls will be updated.",
      },
      {
        title: "5. Local storage",
        body:
          "MALX may use browser local storage to retain operational information such as user preferences, session-related tokens or favourite selections where needed for platform functionality. These technologies may also be subject to privacy and electronic communications rules where applicable.",
      },
      {
        title: "6. Third-party technologies",
        body:
          "External services required to provide certain MALX functions may use their own technologies under their respective policies, for example payment, infrastructure or security providers. We aim to limit the use of such services to what is necessary to operate the platform.",
      },
      {
        title: "7. Retention",
        body:
          "Some cookies may be temporary and expire when you close your browser, while others may remain for a defined period. Retention depends on the purpose of the technology and the operational requirements of the service.",
      },
      {
        title: "8. Managing cookies",
        body:
          "You can manage or delete cookies using your browser settings. Disabling certain necessary technologies may prevent parts of MALX from functioning correctly.",
      },
      {
        title: "9. Changes to this policy",
        body:
          "We may update this Cookie Policy when the technologies used by MALX change or when legal requirements change. The current version will be published on this page.",
      },
      {
        title: "10. Contact",
        body:
          "For questions about cookies or privacy, contact MALX LTD at support@malx.com.",
      },
    ],
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    home: "Back to Home",
  },

  sv: {
    title: "Cookiepolicy",
    updated: "Senast uppdaterad: 20 augusti 2026",
    intro:
      "Denna cookiepolicy beskriver hur MALX LTD använder cookies och liknande tekniker när du använder MALX-plattformen.",
    sections: [
      {
        title: "1. Vad cookies är",
        body:
          "Cookies är små textfiler som kan lagras på din enhet när du besöker en webbplats. Vissa cookies används för att webbplatsen ska fungera korrekt, medan andra kan användas för att förstå användningen eller förbättra tjänsten.",
      },
      {
        title: "2. Nödvändiga tekniker",
        body:
          "MALX kan använda cookies eller liknande lagringstekniker som är nödvändiga för inloggning, sessionshantering, säkerhet, språkinställningar, skydd mot missbruk och annan grundläggande funktionalitet. Dessa tekniker krävs för att tillhandahålla tjänsten och kräver normalt inte samtycke när de är strikt nödvändiga för en tjänst som användaren har begärt.",
      },
      {
        title: "3. Analys",
        body:
          "Om vi i framtiden inför icke nödvändiga analystekniker för att förstå hur besökare använder plattformen kommer vi att lämna lämplig information och begära samtycke när lagen kräver det innan teknikerna aktiveras.",
      },
      {
        title: "4. Reklam och spårning",
        body:
          "Icke nödvändiga cookies eller spårningstekniker för reklam, marknadsföring eller profilering ska inte aktiveras innan det samtycke som krävs enligt lag har erhållits. Om sådana tekniker införs kommer denna policy och våra samtyckesinställningar att uppdateras.",
      },
      {
        title: "5. Lokal lagring",
        body:
          "MALX kan använda webbläsarens lokala lagring för operativ information såsom användarinställningar, sessionsrelaterade tokens eller favoritval när det behövs för plattformens funktion. Sådana tekniker kan också omfattas av regler om integritet och elektronisk kommunikation.",
      },
      {
        title: "6. Teknik från tredje part",
        body:
          "Externa tjänster som behövs för vissa funktioner i MALX kan använda egna tekniker enligt sina respektive policyer, exempelvis betalnings-, infrastruktur- eller säkerhetsleverantörer. Vi strävar efter att begränsa användningen till vad som krävs för att driva plattformen.",
      },
      {
        title: "7. Lagringstid",
        body:
          "Vissa cookies är tillfälliga och upphör när webbläsaren stängs, medan andra kan finnas kvar under en bestämd period. Lagringstiden beror på teknikens syfte och tjänstens operativa behov.",
      },
      {
        title: "8. Hantera cookies",
        body:
          "Du kan hantera eller radera cookies via webbläsarens inställningar. Om nödvändiga tekniker blockeras kan delar av MALX sluta fungera korrekt.",
      },
      {
        title: "9. Ändringar av policyn",
        body:
          "Vi kan uppdatera denna cookiepolicy när teknikerna i MALX eller rättsliga krav ändras. Den aktuella versionen publiceras på denna sida.",
      },
      {
        title: "10. Kontakt",
        body:
          "För frågor om cookies eller integritet kan du kontakta MALX LTD på support@malx.com.",
      },
    ],
    privacy: "Integritetspolicy",
    terms: "Villkor",
    home: "Tillbaka till startsidan",
  },
} as const;

export default function CookiesPage() {
  const { locale, direction } = useLocale();
  const content = CONTENT[locale];

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] px-4 py-12 text-white"
    >
      <div className="mx-auto max-w-4xl">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-7 sm:p-10">
          <p className="text-sm font-black tracking-[0.2em] text-cyan-400">
            MALX LTD
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            {content.title}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {content.updated}
          </p>

          <p className="mt-6 leading-8 text-slate-300">
            {content.intro}
          </p>
        </header>

        <div className="mt-8 space-y-5">
          {content.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6"
            >
              <h2 className="text-xl font-black text-cyan-300">
                {section.title}
              </h2>

              <p className="mt-3 leading-8 text-slate-400">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <nav className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-500"
          >
            {content.privacy}
          </Link>

          <Link
            href="/terms"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-500"
          >
            {content.terms}
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-500"
          >
            {content.home}
          </Link>
        </nav>
      </div>
    </main>
  );
}
