"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

const CONTENT = {
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 20 أغسطس 2026",
    intro:
      "توضح هذه السياسة كيفية قيام MALX LTD بجمع واستخدام وحماية البيانات الشخصية عند استخدام منصة MALX.",
    sections: [
      {
        title: "1. من نحن",
        body:
          "MALX LTD هي الجهة المسؤولة عن معالجة البيانات الشخصية المتعلقة باستخدام منصة MALX. للاستفسارات المتعلقة بالخصوصية يمكنك التواصل معنا عبر support@malx.com.",
      },
      {
        title: "2. البيانات التي نجمعها",
        body:
          "قد نجمع الاسم، اسم المستخدم، البريد الإلكتروني، معلومات الحساب والاشتراك، سجل الاستخدام، المفضلة، الإشعارات، معلومات تقنية مثل عنوان IP وبيانات الجهاز والمتصفح، ومعلومات الدفع المرتبطة بالاشتراك. لا نقوم بتخزين بيانات البطاقة الكاملة عندما تتم معالجة الدفع عبر مزود دفع خارجي.",
      },
      {
        title: "3. لماذا نستخدم بياناتك",
        body:
          "نستخدم البيانات لإنشاء الحساب وإدارته، تقديم خدمات التحليل والتوقعات، إدارة الاشتراكات والمدفوعات، استعادة كلمة المرور، إرسال إشعارات الخدمة، منع الاحتيال وإساءة الاستخدام، حماية المنصة، تحسين الأداء، والامتثال للالتزامات القانونية.",
      },
      {
        title: "4. الأساس القانوني للمعالجة",
        body:
          "نعالج البيانات عندما يكون ذلك ضروريًا لتنفيذ العقد معك، أو للامتثال لالتزام قانوني، أو لتحقيق مصالحنا المشروعة مثل أمن المنصة ومنع الاحتيال وتحسين الخدمة، أو بناءً على موافقتك عندما تكون الموافقة مطلوبة.",
      },
      {
        title: "5. الدفع والاشتراكات",
        body:
          "قد تتم معالجة المدفوعات من خلال مزودي خدمات دفع خارجيين مثل Stripe. يتلقى مزود الدفع البيانات اللازمة لمعالجة المعاملة وفقًا لشروطه وسياسة الخصوصية الخاصة به.",
      },
      {
        title: "6. مشاركة البيانات",
        body:
          "قد نشارك البيانات فقط عند الحاجة مع مزودي الاستضافة والبنية التقنية، مزودي الدفع، خدمات البريد الإلكتروني، مزودي الأمن ومكافحة الاحتيال، المستشارين المهنيين، أو السلطات المختصة عندما يفرض القانون ذلك.",
      },
      {
        title: "7. التحويلات الدولية",
        body:
          "قد يعالج بعض مزودي الخدمة البيانات خارج المملكة المتحدة أو المنطقة الاقتصادية الأوروبية. عندما ينطبق ذلك، نستخدم آليات قانونية مناسبة لحماية البيانات وفقًا لقوانين حماية البيانات المعمول بها.",
      },
      {
        title: "8. مدة الاحتفاظ بالبيانات",
        body:
          "نحتفظ بالبيانات فقط للمدة اللازمة لتقديم الخدمة، إدارة الحساب والاشتراك، الوفاء بالالتزامات القانونية والمحاسبية، حل النزاعات، وحماية مصالحنا القانونية. قد تختلف مدة الاحتفاظ بحسب نوع البيانات والغرض منها.",
      },
      {
        title: "9. حقوقك",
        body:
          "بحسب القانون المطبق، قد يكون لك الحق في الوصول إلى بياناتك، تصحيحها، حذفها، تقييد معالجتها، الاعتراض على بعض أنواع المعالجة، نقل بياناتك، وسحب الموافقة عندما تعتمد المعالجة على الموافقة. لممارسة حقوقك تواصل معنا عبر support@malx.com.",
      },
      {
        title: "10. الشكاوى",
        body:
          "يمكنك التواصل معنا أولًا بشأن أي مشكلة تتعلق بالخصوصية. كما يحق لك تقديم شكوى إلى سلطة حماية البيانات المختصة في الدولة التي تقيم أو تعمل فيها أو التي تعتقد أن المخالفة حدثت فيها.",
      },
      {
        title: "11. أمن البيانات",
        body:
          "نستخدم تدابير تقنية وتنظيمية مناسبة لحماية البيانات من الوصول غير المصرح به أو الفقد أو التغيير أو الإفصاح غير المشروع. ومع ذلك، لا يمكن ضمان أمان أي نظام إلكتروني بنسبة 100%.",
      },
      {
        title: "12. ملفات الارتباط",
        body:
          "قد تستخدم MALX ملفات ارتباط وتقنيات مشابهة لتشغيل الموقع والحفاظ على الجلسات والأمان وتحسين الخدمة. يمكنك الاطلاع على التفاصيل في سياسة ملفات الارتباط.",
      },
      {
        title: "13. التعديلات على هذه السياسة",
        body:
          "قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر النسخة المحدثة على هذه الصفحة مع تاريخ آخر تحديث.",
      },
      {
        title: "14. التواصل",
        body:
          "MALX LTD — البريد الإلكتروني: support@malx.com",
      },
    ],
    cookies: "سياسة ملفات الارتباط",
    terms: "الشروط والأحكام",
    home: "العودة إلى الرئيسية",
  },

  en: {
    title: "Privacy Policy",
    updated: "Last updated: 20 August 2026",
    intro:
      "This Privacy Policy explains how MALX LTD collects, uses and protects personal data when you use the MALX platform.",
    sections: [
      {
        title: "1. Who we are",
        body:
          "MALX LTD is responsible for the processing of personal data relating to the use of the MALX platform. For privacy enquiries, contact us at support@malx.com.",
      },
      {
        title: "2. Personal data we collect",
        body:
          "We may collect your name, username, email address, account and subscription information, usage history, favourites, notifications, technical information such as IP address, browser and device data, and payment-related information. We do not store full card details where payments are processed by an external payment provider.",
      },
      {
        title: "3. How we use your data",
        body:
          "We use personal data to create and manage accounts, provide football analysis and prediction services, manage subscriptions and payments, provide password recovery, send service notifications, prevent fraud and abuse, secure and improve the platform, and comply with legal obligations.",
      },
      {
        title: "4. Lawful bases",
        body:
          "We process personal data where necessary to perform our contract with you, comply with legal obligations, pursue legitimate interests such as platform security, fraud prevention and service improvement, or where you have given consent when consent is required.",
      },
      {
        title: "5. Payments and subscriptions",
        body:
          "Payments may be processed by third-party payment providers such as Stripe. The payment provider receives information necessary to process your transaction in accordance with its own terms and privacy policy.",
      },
      {
        title: "6. Sharing personal data",
        body:
          "We may share personal data where necessary with hosting and infrastructure providers, payment providers, email service providers, security and fraud-prevention providers, professional advisers, or competent authorities where required by law.",
      },
      {
        title: "7. International transfers",
        body:
          "Some service providers may process data outside the United Kingdom or European Economic Area. Where applicable, we use appropriate legal safeguards for international transfers in accordance with applicable data protection law.",
      },
      {
        title: "8. Data retention",
        body:
          "We retain personal data only for as long as necessary to provide the service, manage accounts and subscriptions, meet legal and accounting requirements, resolve disputes and protect our legal interests. Retention periods may vary according to the type and purpose of the data.",
      },
      {
        title: "9. Your rights",
        body:
          "Depending on applicable law, you may have rights to access, correct, erase, restrict or object to processing of your personal data, request data portability, and withdraw consent where processing is based on consent. To exercise your rights, contact support@malx.com.",
      },
      {
        title: "10. Complaints",
        body:
          "You may contact us first about any privacy concern. You also have the right to complain to the relevant data protection supervisory authority in the country where you live or work, or where you believe an infringement occurred.",
      },
      {
        title: "11. Security",
        body:
          "We use appropriate technical and organisational measures to protect personal data against unauthorised access, loss, alteration or unlawful disclosure. However, no electronic system can be guaranteed to be completely secure.",
      },
      {
        title: "12. Cookies",
        body:
          "MALX may use cookies and similar technologies to operate the website, maintain sessions, provide security and improve the service. More information is available in our Cookie Policy.",
      },
      {
        title: "13. Changes to this policy",
        body:
          "We may update this Privacy Policy from time to time. The updated version will be published on this page together with its latest revision date.",
      },
      {
        title: "14. Contact",
        body:
          "MALX LTD — Email: support@malx.com",
      },
    ],
    cookies: "Cookie Policy",
    terms: "Terms & Conditions",
    home: "Back to Home",
  },

  sv: {
    title: "Integritetspolicy",
    updated: "Senast uppdaterad: 20 augusti 2026",
    intro:
      "Denna integritetspolicy beskriver hur MALX LTD samlar in, använder och skyddar personuppgifter när du använder MALX-plattformen.",
    sections: [
      {
        title: "1. Vilka vi är",
        body:
          "MALX LTD ansvarar för behandlingen av personuppgifter som rör användningen av MALX-plattformen. För frågor om integritet kan du kontakta oss på support@malx.com.",
      },
      {
        title: "2. Personuppgifter vi samlar in",
        body:
          "Vi kan samla in namn, användarnamn, e-postadress, konto- och abonnemangsinformation, användningshistorik, favoriter, aviseringar, teknisk information såsom IP-adress, webbläsare och enhetsdata samt betalningsrelaterad information. Vi lagrar inte fullständiga kortuppgifter när betalningen hanteras av en extern betalningsleverantör.",
      },
      {
        title: "3. Hur vi använder uppgifterna",
        body:
          "Vi använder personuppgifter för att skapa och hantera konton, tillhandahålla fotbollsanalys och prognoser, hantera abonnemang och betalningar, återställa lösenord, skicka serviceaviseringar, förebygga bedrägerier och missbruk, skydda och förbättra plattformen samt följa rättsliga skyldigheter.",
      },
      {
        title: "4. Rättslig grund",
        body:
          "Vi behandlar personuppgifter när det är nödvändigt för att fullgöra avtalet med dig, uppfylla rättsliga skyldigheter, tillgodose berättigade intressen såsom säkerhet, bedrägeribekämpning och förbättring av tjänsten, eller med stöd av ditt samtycke när samtycke krävs.",
      },
      {
        title: "5. Betalningar och abonnemang",
        body:
          "Betalningar kan behandlas av externa betalningsleverantörer såsom Stripe. Betalningsleverantören får den information som behövs för att genomföra transaktionen enligt sina egna villkor och sin integritetspolicy.",
      },
      {
        title: "6. Delning av personuppgifter",
        body:
          "Vi kan vid behov dela personuppgifter med leverantörer av hosting och teknisk infrastruktur, betalningsleverantörer, e-postleverantörer, säkerhets- och bedrägeribekämpningstjänster, professionella rådgivare eller behöriga myndigheter när lagen kräver det.",
      },
      {
        title: "7. Internationella överföringar",
        body:
          "Vissa tjänsteleverantörer kan behandla personuppgifter utanför Storbritannien eller Europeiska ekonomiska samarbetsområdet. När det är relevant använder vi lämpliga rättsliga skyddsåtgärder för sådana överföringar.",
      },
      {
        title: "8. Lagringstid",
        body:
          "Vi behåller personuppgifter endast så länge det är nödvändigt för att tillhandahålla tjänsten, hantera konton och abonnemang, uppfylla rättsliga och bokföringsmässiga krav, lösa tvister och skydda våra rättsliga intressen.",
      },
      {
        title: "9. Dina rättigheter",
        body:
          "Beroende på tillämplig lag kan du ha rätt till tillgång, rättelse, radering, begränsning, invändning, dataportabilitet och att återkalla samtycke när behandlingen grundas på samtycke. Kontakta support@malx.com för att utöva dina rättigheter.",
      },
      {
        title: "10. Klagomål",
        body:
          "Du kan först kontakta oss om integritetsfrågor. Du har också rätt att lämna klagomål till relevant dataskyddsmyndighet där du bor eller arbetar, eller där du anser att en överträdelse har skett.",
      },
      {
        title: "11. Säkerhet",
        body:
          "Vi använder lämpliga tekniska och organisatoriska säkerhetsåtgärder för att skydda personuppgifter mot obehörig åtkomst, förlust, ändring eller olagligt utlämnande. Inget elektroniskt system kan dock garanteras vara helt säkert.",
      },
      {
        title: "12. Cookies",
        body:
          "MALX kan använda cookies och liknande tekniker för att driva webbplatsen, upprätthålla sessioner, ge säkerhet och förbättra tjänsten. Mer information finns i vår Cookiepolicy.",
      },
      {
        title: "13. Ändringar",
        body:
          "Vi kan uppdatera denna integritetspolicy från tid till annan. Den senaste versionen publiceras på denna sida tillsammans med datum för senaste uppdatering.",
      },
      {
        title: "14. Kontakt",
        body:
          "MALX LTD — E-post: support@malx.com",
      },
    ],
    cookies: "Cookiepolicy",
    terms: "Villkor",
    home: "Tillbaka till startsidan",
  },
} as const;

export default function PrivacyPage() {
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
            href="/terms"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-500"
          >
            {content.terms}
          </Link>

          <Link
            href="/cookies"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-500"
          >
            {content.cookies}
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
