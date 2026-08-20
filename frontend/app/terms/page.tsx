"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

const CONTENT = {
  ar: {
    title: "الشروط والأحكام",
    updated: "آخر تحديث: 20 أغسطس 2026",
    intro:
      "تحكم هذه الشروط والأحكام استخدامك لمنصة MALX والخدمات المقدمة من MALX LTD. باستخدام المنصة أو إنشاء حساب، فإنك توافق على الالتزام بهذه الشروط.",
    sections: [
      {
        title: "1. عن MALX",
        body:
          "MALX هي منصة لتحليل مباريات كرة القدم وتقديم الإحصائيات والتوقعات والمعلومات المتعلقة بالمباريات. يتم تشغيل الخدمة بواسطة MALX LTD. للاستفسارات يمكنك التواصل معنا عبر support@malx.com.",
      },
      {
        title: "2. قبول الشروط",
        body:
          "باستخدام منصة MALX أو إنشاء حساب فيها، فإنك تؤكد أنك قرأت هذه الشروط وفهمتها ووافقت عليها. إذا كنت لا توافق على هذه الشروط، فيجب عليك عدم استخدام الخدمة.",
      },
      {
        title: "3. الحسابات",
        body:
          "قد تتطلب بعض خدمات MALX إنشاء حساب. أنت مسؤول عن تقديم معلومات صحيحة والمحافظة على سرية بيانات تسجيل الدخول الخاصة بك وعن جميع الأنشطة التي تتم من خلال حسابك. يجب إبلاغنا فورًا إذا كنت تعتقد أن حسابك تعرض لاستخدام غير مصرح به.",
      },
      {
        title: "4. التحليلات والتوقعات",
        body:
          "تقدم MALX تحليلات وإحصائيات وتوقعات لكرة القدم اعتمادًا على البيانات والنماذج التحليلية المتاحة. جميع التوقعات احتمالية بطبيعتها ولا تضمن MALX دقة أي توقع أو نتيجة مستقبلية أو نتيجة مباراة.",
      },
      {
        title: "5. لا يوجد ضمان للربح",
        body:
          "المعلومات والتوقعات التي تقدمها MALX هي لأغراض معلوماتية وتحليلية فقط ولا تمثل ضمانًا للفوز أو تحقيق أرباح مالية. يتحمل المستخدم وحده مسؤولية أي قرار يتخذه اعتمادًا على المعلومات المقدمة عبر المنصة.",
      },
      {
        title: "6. المراهنات والقمار",
        body:
          "MALX ليست شركة مراهنات ولا تقبل أو تدير الرهانات. إذا استخدم المستخدم معلومات MALX فيما يتعلق بالمراهنات، فإنه يفعل ذلك على مسؤوليته الخاصة ويجب عليه الالتزام بالقوانين والقيود العمرية المعمول بها في بلده. لا تشجع MALX القمار غير القانوني أو الاستخدام غير المسؤول لخدمات المراهنة.",
      },
      {
        title: "7. الاشتراكات المدفوعة",
        body:
          "قد تتطلب بعض الميزات اشتراكًا مدفوعًا. يتم عرض السعر وفترة الفوترة والمزايا الأساسية قبل إتمام الاشتراك. قد تتجدد الاشتراكات تلقائيًا عندما يتم توضيح ذلك للمستخدم قبل الشراء. تخضع عمليات الإلغاء والاسترداد لشروط الاشتراك والإلغاء المعروضة على المنصة والقانون الإلزامي المطبق.",
      },
      {
        title: "8. المدفوعات",
        body:
          "قد تتم معالجة المدفوعات بواسطة مزودي دفع خارجيين. أنت توافق على تقديم معلومات دفع صحيحة وعلى دفع الرسوم المعلنة عند شراء الاشتراك. قد يخضع استخدام خدمات الدفع أيضًا لشروط مزود الدفع وسياسة الخصوصية الخاصة به.",
      },
      {
        title: "9. الاستخدام المقبول",
        body:
          "لا يجوز استخدام MALX لأغراض غير قانونية أو لمحاولة اختراق المنصة أو تعطيلها أو إساءة استخدامها أو الوصول غير المصرح به إلى الحسابات أو الأنظمة أو البيانات. كما لا يجوز استخدام وسائل آلية لجمع كميات كبيرة من البيانات من المنصة دون إذن كتابي منا.",
      },
      {
        title: "10. الملكية الفكرية",
        body:
          "تظل حقوق منصة MALX وتصميمها وبرمجياتها ومحتواها الأصلي ونماذجها وتحليلاتها وعلاماتها التجارية مملوكة لأصحاب الحقوق المعنيين. لا يمنح استخدام الخدمة المستخدم حق نسخ أو إعادة بيع أو توزيع المحتوى أو استغلاله تجاريًا إلا بالقدر المسموح به صراحة أو بموجب القانون.",
      },
      {
        title: "11. خدمات وبيانات الأطراف الثالثة",
        body:
          "قد تعتمد بعض وظائف MALX على بيانات أو خدمات مقدمة من أطراف ثالثة. قد تتغير هذه البيانات أو تتأخر أو تصبح غير متاحة، ولا يمكننا ضمان استمرار أو دقة الخدمات الخارجية في جميع الأوقات.",
      },
      {
        title: "12. توفر الخدمة",
        body:
          "نسعى إلى توفير MALX بصورة مستقرة وآمنة، لكننا لا نضمن أن تكون الخدمة متاحة دون انقطاع أو أخطاء في جميع الأوقات. قد نقوم بالصيانة أو التحديث أو تعديل بعض الميزات عندما يكون ذلك ضروريًا لتشغيل المنصة أو تحسينها.",
      },
      {
        title: "13. تحديد المسؤولية",
        body:
          "إلى الحد الذي يسمح به القانون، لا تتحمل MALX LTD المسؤولية عن الخسائر الناتجة عن الاعتماد على توقعات أو تحليلات المنصة أو عن قرارات المستخدم المتعلقة بالمراهنات أو الاستثمار أو أي نشاط مالي. لا تستبعد هذه الشروط أي مسؤولية لا يجوز استبعادها أو تقييدها بموجب القانون الإلزامي.",
      },
      {
        title: "14. تعليق أو إنهاء الحساب",
        body:
          "يجوز لنا تعليق أو تقييد أو إنهاء الوصول إلى الحساب عند وجود احتيال أو إساءة استخدام أو انتهاك جوهري لهذه الشروط أو عندما يكون ذلك ضروريًا لحماية المنصة أو مستخدميها أو للامتثال للقانون.",
      },
      {
        title: "15. الخصوصية",
        body:
          "تتم معالجة البيانات الشخصية وفقًا لسياسة الخصوصية الخاصة بـ MALX. ننصح بقراءة سياسة الخصوصية لفهم أنواع البيانات التي نعالجها وأسباب المعالجة وحقوقك المتعلقة ببياناتك.",
      },
      {
        title: "16. حقوق المستهلك",
        body:
          "لا تؤثر هذه الشروط على حقوق المستهلك الإلزامية التي يمنحها لك القانون المعمول به. إذا كان قانون حماية المستهلك في بلد إقامتك يمنحك حقوقًا لا يمكن التنازل عنها تعاقديًا، فتبقى تلك الحقوق سارية.",
      },
      {
        title: "17. التغييرات على الشروط",
        body:
          "قد نقوم بتحديث هذه الشروط من وقت لآخر لأسباب قانونية أو تشغيلية أو لتطوير الخدمة. سيتم نشر النسخة المحدثة على هذه الصفحة مع تاريخ آخر تحديث، وسنقدم إشعارًا مناسبًا عندما يتطلب القانون ذلك.",
      },
      {
        title: "18. القانون والاختصاص",
        body:
          "تخضع العلاقة بين MALX LTD والمستخدم للقوانين الإلزامية المطبقة والحقوق التي يتمتع بها المستهلك في مكان إقامته. لا تهدف هذه الشروط إلى حرمان المستهلك من الحماية التي لا يجوز استبعادها بموجب القانون.",
      },
      {
        title: "19. التواصل",
        body:
          "للاستفسارات المتعلقة بهذه الشروط يمكنك التواصل مع MALX LTD عبر البريد الإلكتروني: support@malx.com.",
      },
    ],
    privacy: "سياسة الخصوصية",
    subscription: "شروط الاشتراك والإلغاء",
    home: "العودة للرئيسية",
  },

  en: {
    title: "Terms & Conditions",
    updated: "Last updated: 20 August 2026",
    intro:
      "These Terms & Conditions govern your use of the MALX platform and services provided by MALX LTD. By using the platform or creating an account, you agree to these terms.",
    sections: [
      {
        title: "1. About MALX",
        body:
          "MALX is a football analysis platform providing statistics, analysis and predictions relating to football matches. The service is operated by MALX LTD. You can contact us at support@malx.com.",
      },
      {
        title: "2. Acceptance of Terms",
        body:
          "By using MALX or creating an account, you confirm that you have read, understood and agreed to these Terms. If you do not agree, you must not use the service.",
      },
      {
        title: "3. Accounts",
        body:
          "Some MALX services may require an account. You are responsible for providing accurate information, keeping your login credentials confidential and for activity carried out through your account. You should contact us promptly if you believe your account has been used without authorisation.",
      },
      {
        title: "4. Analysis and Predictions",
        body:
          "MALX provides football statistics, analysis and predictions based on available data and analytical models. Predictions are probabilistic by nature. MALX does not guarantee the accuracy of any prediction, future event or match result.",
      },
      {
        title: "5. No Guarantee of Profit",
        body:
          "Information and predictions provided by MALX are for informational and analytical purposes only and do not guarantee winnings or financial profit. Users remain solely responsible for decisions made using information provided by the platform.",
      },
      {
        title: "6. Betting and Gambling",
        body:
          "MALX is not a bookmaker and does not accept or operate bets. If a user chooses to use MALX information in connection with betting, they do so at their own risk and must comply with applicable laws and age restrictions in their jurisdiction. MALX does not encourage illegal gambling or irresponsible betting.",
      },
      {
        title: "7. Paid Subscriptions",
        body:
          "Certain features may require a paid subscription. The applicable price, billing period and key subscription features will be displayed before purchase. Subscriptions may renew automatically where this is clearly disclosed before purchase. Cancellation and refund rights are subject to the Subscription & Cancellation Terms and applicable mandatory law.",
      },
      {
        title: "8. Payments",
        body:
          "Payments may be processed by third-party payment providers. You agree to provide accurate payment information and pay the charges displayed when purchasing a subscription. Payment services may also be subject to the payment provider's own terms and privacy policy.",
      },
      {
        title: "9. Acceptable Use",
        body:
          "You must not use MALX for unlawful purposes, attempt to compromise or disrupt the platform, gain unauthorised access to accounts, systems or data, or otherwise misuse the service. Automated collection of substantial amounts of platform data without our written permission is prohibited.",
      },
      {
        title: "10. Intellectual Property",
        body:
          "Rights in the MALX platform, software, original content, design, analytical materials, models and trademarks remain with their respective rights holders. Use of the service does not grant a right to copy, resell, distribute or commercially exploit content except where expressly permitted or required by law.",
      },
      {
        title: "11. Third-Party Services and Data",
        body:
          "Certain MALX functions may depend on data or services supplied by third parties. Such data or services may change, be delayed or become unavailable, and we cannot guarantee the continuous availability or accuracy of third-party services.",
      },
      {
        title: "12. Service Availability",
        body:
          "We aim to provide MALX reliably and securely, but we do not guarantee uninterrupted or error-free availability. Maintenance, updates or changes to features may be carried out where necessary to operate, secure or improve the platform.",
      },
      {
        title: "13. Limitation of Liability",
        body:
          "To the extent permitted by law, MALX LTD is not responsible for losses arising from reliance on platform predictions or analysis, or from user decisions relating to betting, investment or other financial activity. Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited.",
      },
      {
        title: "14. Suspension or Termination",
        body:
          "We may suspend, restrict or terminate access to an account in cases of fraud, misuse, material breach of these Terms, or where necessary to protect the platform or its users or to comply with applicable law.",
      },
      {
        title: "15. Privacy",
        body:
          "Personal data is processed in accordance with the MALX Privacy Policy. You should review the Privacy Policy for information about the personal data we process, the purposes of processing and your data protection rights.",
      },
      {
        title: "16. Consumer Rights",
        body:
          "These Terms do not affect mandatory consumer rights available to you under applicable law. Where consumer protection law in your country of residence provides rights that cannot be contractually waived, those rights remain unaffected.",
      },
      {
        title: "17. Changes to These Terms",
        body:
          "We may update these Terms from time to time for legal, operational or service-development reasons. The updated version will be published on this page with its revision date, and appropriate notice will be provided where required by law.",
      },
      {
        title: "18. Applicable Law",
        body:
          "The relationship between MALX LTD and users remains subject to applicable mandatory laws and consumer protections. Nothing in these Terms is intended to deprive consumers of protections that cannot legally be excluded.",
      },
      {
        title: "19. Contact",
        body:
          "For questions concerning these Terms, contact MALX LTD at support@malx.com.",
      },
    ],
    privacy: "Privacy Policy",
    subscription: "Subscription & Cancellation",
    home: "Back to Home",
  },

  sv: {
    title: "Villkor",
    updated: "Senast uppdaterad: 20 augusti 2026",
    intro:
      "Dessa villkor reglerar din användning av MALX-plattformen och tjänster som tillhandahålls av MALX LTD. Genom att använda plattformen eller skapa ett konto godkänner du dessa villkor.",
    sections: [
      {
        title: "1. Om MALX",
        body:
          "MALX är en plattform för fotbollsanalys som tillhandahåller statistik, analyser och prognoser för fotbollsmatcher. Tjänsten drivs av MALX LTD. Du kan kontakta oss på support@malx.com.",
      },
      {
        title: "2. Godkännande av villkoren",
        body:
          "Genom att använda MALX eller skapa ett konto bekräftar du att du har läst, förstått och godkänt dessa villkor. Om du inte accepterar villkoren ska du inte använda tjänsten.",
      },
      {
        title: "3. Konton",
        body:
          "Vissa MALX-tjänster kan kräva ett konto. Du ansvarar för att lämna korrekta uppgifter, hålla dina inloggningsuppgifter konfidentiella och för aktiviteter som utförs via ditt konto. Kontakta oss omgående om du misstänker obehörig användning.",
      },
      {
        title: "4. Analyser och prognoser",
        body:
          "MALX tillhandahåller fotbollsstatistik, analyser och prognoser baserade på tillgängliga data och analytiska modeller. Prognoser är sannolikhetsbaserade och MALX garanterar inte riktigheten i någon prognos, framtida händelse eller matchresultat.",
      },
      {
        title: "5. Ingen garanti för vinst",
        body:
          "Information och prognoser från MALX tillhandahålls endast för informations- och analysändamål och innebär ingen garanti för vinst eller ekonomisk avkastning. Användaren ansvarar själv för beslut som fattas med hjälp av information från plattformen.",
      },
      {
        title: "6. Betting och spel",
        body:
          "MALX är inte ett spelbolag och tar inte emot eller administrerar vad. Om användaren väljer att använda MALX-information i samband med betting sker detta på egen risk och användaren måste följa tillämpliga lagar och åldersgränser. MALX uppmuntrar inte olagligt eller oansvarigt spelande.",
      },
      {
        title: "7. Betalda abonnemang",
        body:
          "Vissa funktioner kan kräva ett betalt abonnemang. Pris, faktureringsperiod och viktiga abonnemangsvillkor visas före köp. Abonnemang kan förnyas automatiskt när detta tydligt anges före köpet. Uppsägning och återbetalning regleras av villkoren för abonnemang och uppsägning samt tillämplig tvingande lag.",
      },
      {
        title: "8. Betalningar",
        body:
          "Betalningar kan behandlas av externa betalningsleverantörer. Du ansvarar för att lämna korrekta betalningsuppgifter och betala de avgifter som visas vid köp. Betaltjänster kan även omfattas av betalningsleverantörens egna villkor och integritetspolicy.",
      },
      {
        title: "9. Tillåten användning",
        body:
          "Du får inte använda MALX för olagliga ändamål, försöka störa eller kompromettera plattformen, få obehörig åtkomst till konton, system eller data eller på annat sätt missbruka tjänsten. Automatisk insamling av stora mängder data utan vårt skriftliga tillstånd är förbjuden.",
      },
      {
        title: "10. Immateriella rättigheter",
        body:
          "Rättigheterna till MALX-plattformen, programvaran, originalinnehållet, designen, analysmaterialet, modellerna och varumärkena tillhör respektive rättighetsinnehavare. Användningen av tjänsten ger ingen rätt att kopiera, sälja vidare, distribuera eller kommersiellt exploatera innehållet annat än när detta uttryckligen tillåts eller följer av lag.",
      },
      {
        title: "11. Tredjepartstjänster och data",
        body:
          "Vissa funktioner i MALX kan vara beroende av data eller tjänster från tredje part. Sådana data och tjänster kan ändras, försenas eller bli otillgängliga och vi kan inte garantera deras kontinuerliga tillgänglighet eller riktighet.",
      },
      {
        title: "12. Tjänstens tillgänglighet",
        body:
          "Vi strävar efter att tillhandahålla MALX på ett stabilt och säkert sätt men garanterar inte oavbruten eller felfri tillgänglighet. Underhåll, uppdateringar och ändringar kan genomföras när det behövs för att driva, skydda eller förbättra plattformen.",
      },
      {
        title: "13. Ansvarsbegränsning",
        body:
          "I den utsträckning lagen tillåter ansvarar MALX LTD inte för förluster som uppstår genom användning av plattformens prognoser eller analyser eller genom användarens beslut om betting, investeringar eller annan ekonomisk aktivitet. Inget i dessa villkor begränsar ansvar som enligt lag inte får begränsas.",
      },
      {
        title: "14. Avstängning eller avslutande",
        body:
          "Vi kan stänga av, begränsa eller avsluta tillgången till ett konto vid bedrägeri, missbruk, väsentligt brott mot dessa villkor eller när det är nödvändigt för att skydda plattformen, användarna eller följa lagen.",
      },
      {
        title: "15. Integritet",
        body:
          "Personuppgifter behandlas enligt MALX integritetspolicy. Läs integritetspolicyn för information om vilka personuppgifter vi behandlar, varför de behandlas och vilka rättigheter du har.",
      },
      {
        title: "16. Konsumenträttigheter",
        body:
          "Dessa villkor påverkar inte tvingande konsumenträttigheter enligt tillämplig lag. Om konsumentskyddslagstiftningen i ditt bosättningsland ger rättigheter som inte kan avtalas bort förblir dessa rättigheter oförändrade.",
      },
      {
        title: "17. Ändringar av villkoren",
        body:
          "Vi kan uppdatera dessa villkor av juridiska, operativa eller tjänsterelaterade skäl. Den senaste versionen publiceras på denna sida tillsammans med datum för senaste uppdatering och lämpligt meddelande lämnas när lagen kräver det.",
      },
      {
        title: "18. Tillämplig lag",
        body:
          "Förhållandet mellan MALX LTD och användaren omfattas av tillämplig tvingande lag och konsumentskydd. Dessa villkor är inte avsedda att frånta konsumenter rättigheter som enligt lag inte får begränsas.",
      },
      {
        title: "19. Kontakt",
        body:
          "För frågor om dessa villkor kan du kontakta MALX LTD via support@malx.com.",
      },
    ],
    privacy: "Integritetspolicy",
    subscription: "Abonnemang & uppsägning",
    home: "Tillbaka till startsidan",
  },
} as const;

export default function TermsPage() {
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
            href="/subscription-terms"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-500"
          >
            {content.subscription}
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
