"use client";

import Link from "next/link";

import { useLocale } from "@/context/locale-context";

const CONTENT = {
  ar: {
    title: "شروط الاشتراك والإلغاء",
    updated: "آخر تحديث: 20 أغسطس 2026",
    intro:
      "توضح هذه الشروط قواعد الاشتراكات المدفوعة في MALX، بما في ذلك الفوترة والتجديد والإلغاء وحقوق المستهلك.",
    sections: [
      {
        title: "1. مقدم الخدمة",
        body:
          "يتم تقديم اشتراكات MALX بواسطة MALX LTD. للاستفسارات المتعلقة بالاشتراكات أو المدفوعات يمكنك التواصل معنا عبر support@malx.com.",
      },
      {
        title: "2. خطط الاشتراك",
        body:
          "قد تقدم MALX خططًا مجانية ومدفوعة مثل Pro وPremium. يتم عرض السعر وفترة الفوترة والميزات الأساسية لكل خطة قبل إتمام عملية الشراء.",
      },
      {
        title: "3. الأسعار والضرائب",
        body:
          "يظهر السعر المطبق قبل الانتقال إلى الدفع. قد تطبق الضرائب أو ضريبة القيمة المضافة وفقًا لموقع العميل والقواعد القانونية المعمول بها، وسيتم عرض المبلغ النهائي قبل تأكيد الدفع عندما يكون ذلك مطلوبًا.",
      },
      {
        title: "4. التجديد التلقائي",
        body:
          "قد تتجدد الاشتراكات المدفوعة تلقائيًا في نهاية كل فترة فوترة ما لم يتم إلغاؤها قبل موعد التجديد. سيتم توضيح طبيعة التجديد الدوري للمستخدم قبل إتمام الاشتراك.",
      },
      {
        title: "5. الإلغاء",
        body:
          "يمكن للمستخدم إيقاف التجديد التلقائي من خلال أدوات إدارة الاشتراك المتاحة في حسابه. عند الإلغاء، تبقى الخطة المدفوعة فعالة عادةً حتى نهاية فترة الاشتراك المدفوعة الحالية، وبعدها لا يتم تحصيل رسوم تجديد جديدة.",
      },
      {
        title: "6. حق الانسحاب للمستهلك",
        body:
          "إذا كنت مستهلكًا وتتمتع بحق انسحاب قانوني بموجب قوانين المملكة المتحدة أو الاتحاد الأوروبي أو أي قانون إلزامي آخر، فإن حقوقك القانونية تبقى سارية. في بعض الحالات، قد يكون للمستهلك حق الانسحاب من عقد عن بُعد خلال 14 يومًا وفقًا للقانون المطبق.",
      },
      {
        title: "7. بدء الخدمة الرقمية فورًا",
        body:
          "عندما يطلب المستخدم بدء تقديم خدمة رقمية مدفوعة فور إتمام الشراء، قد يؤثر بدء تنفيذ الخدمة على حق الانسحاب أو على المبلغ القابل للاسترداد وفقًا للقانون المطبق. لن يتم تفسير هذه الشروط على أنها تلغي أي حق لا يجوز قانونًا التنازل عنه.",
      },
      {
        title: "8. الاسترداد",
        body:
          "تتم معالجة طلبات الاسترداد وفقًا لحقوق المستهلك الإلزامية والقانون المطبق وظروف كل معاملة. لا تحد هذه السياسة من أي حق قانوني إلزامي في الاسترداد أو التعويض. يمكن تقديم طلب عبر support@malx.com.",
      },
      {
        title: "9. فشل الدفع",
        body:
          "إذا تعذر تحصيل رسوم الاشتراك، فقد نحاول إعادة معالجة الدفع أو نطلب تحديث وسيلة الدفع. قد يتم تعليق أو تخفيض مستوى الاشتراك إذا استمر فشل الدفع، وفقًا للقواعد المعروضة للمستخدم.",
      },
      {
        title: "10. تغيير الخطة",
        body:
          "يمكن أن تسمح MALX بالترقية أو تغيير خطة الاشتراك. قد يختلف توقيت تطبيق الخطة الجديدة وطريقة احتساب الرسوم أو الرصيد وفقًا لنوع التغيير ومزود الدفع، وسيتم إظهار المعلومات ذات الصلة قبل تأكيد العملية عندما يكون ذلك مطلوبًا.",
      },
      {
        title: "11. تغييرات الأسعار",
        body:
          "قد نقوم بتغيير أسعار الاشتراكات المستقبلية. عندما يؤثر التغيير على اشتراك قائم ومتجدد، سنقدم إشعارًا مناسبًا مسبقًا عندما يطلب القانون ذلك، وسيظل للمستخدم حق الإلغاء قبل تطبيق السعر الجديد.",
      },
      {
        title: "12. معالجة المدفوعات",
        body:
          "قد تتم معالجة المدفوعات من خلال Stripe أو مزود دفع آخر. لا تقوم MALX عادةً بتخزين بيانات البطاقة الكاملة، وتتم معالجة معلومات الدفع وفقًا لأنظمة وسياسات مزود الدفع.",
      },
      {
        title: "13. عدم ضمان النتائج",
        body:
          "شراء اشتراك MALX يمنح الوصول إلى ميزات وتحليلات إضافية فقط. لا يضمن الاشتراك دقة التوقعات أو نتائج المباريات أو تحقيق أي أرباح مالية.",
      },
      {
        title: "14. إنهاء الحساب",
        body:
          "إنهاء الحساب أو تعليق الخدمة بسبب إساءة الاستخدام لا يلغي حقوق المستهلك الإلزامية. قد تختلف آثار الإنهاء على الاشتراك حسب سبب الإنهاء والقانون المطبق.",
      },
      {
        title: "15. حقوق المستهلك",
        body:
          "لا تؤثر هذه الشروط على الحقوق التي لا يجوز استبعادها أو تقييدها بموجب قوانين حماية المستهلك المعمول بها في بلد إقامة المستخدم.",
      },
      {
        title: "16. التواصل بشأن الفوترة",
        body:
          "للاستفسارات حول الاشتراك أو الإلغاء أو الفواتير أو طلبات الاسترداد، تواصل مع MALX LTD عبر support@malx.com.",
      },
    ],
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    home: "العودة للرئيسية",
  },

  en: {
    title: "Subscription & Cancellation Terms",
    updated: "Last updated: 20 August 2026",
    intro:
      "These terms explain the rules governing paid MALX subscriptions, including billing, renewal, cancellation and consumer rights.",
    sections: [
      {
        title: "1. Service provider",
        body:
          "MALX subscriptions are provided by MALX LTD. For subscription or payment enquiries, contact support@malx.com.",
      },
      {
        title: "2. Subscription plans",
        body:
          "MALX may offer free and paid plans including Pro and Premium. The price, billing period and key features of each plan are displayed before purchase.",
      },
      {
        title: "3. Prices and taxes",
        body:
          "The applicable price is displayed before payment. Taxes or VAT may apply depending on the customer's location and applicable law, and the final amount will be shown before payment confirmation where required.",
      },
      {
        title: "4. Automatic renewal",
        body:
          "Paid subscriptions may renew automatically at the end of each billing period unless cancelled before renewal. The recurring nature of the subscription will be disclosed before the user completes the purchase.",
      },
      {
        title: "5. Cancellation",
        body:
          "Users can stop automatic renewal using the subscription-management tools available in their account. After cancellation, the paid plan will normally remain active until the end of the current paid billing period and no further renewal charge will be taken.",
      },
      {
        title: "6. Consumer withdrawal rights",
        body:
          "If you are a consumer entitled to a statutory withdrawal or cancellation right under United Kingdom, European Union or other mandatory consumer law, those rights remain unaffected. In some circumstances, consumers may have a 14-day withdrawal period for distance contracts under applicable law.",
      },
      {
        title: "7. Immediate digital service",
        body:
          "Where a user requests immediate performance of a paid digital service after purchase, commencement of the service may affect statutory withdrawal rights or the amount that may be refundable under applicable law. Nothing in these Terms removes rights that cannot lawfully be waived.",
      },
      {
        title: "8. Refunds",
        body:
          "Refund requests are handled in accordance with mandatory consumer rights, applicable law and the circumstances of the transaction. This policy does not restrict any statutory right to a refund or remedy. Requests may be submitted to support@malx.com.",
      },
      {
        title: "9. Failed payments",
        body:
          "If a subscription payment fails, we may retry the payment or request that the payment method be updated. Continued payment failure may result in suspension or downgrade of the subscription in accordance with the applicable service rules.",
      },
      {
        title: "10. Plan changes",
        body:
          "MALX may allow users to upgrade or change subscription plans. The timing of the change and any charge, credit or proration may depend on the type of change and payment provider. Relevant information will be shown before confirmation where required.",
      },
      {
        title: "11. Price changes",
        body:
          "We may change subscription prices for future billing periods. Where a change affects an existing recurring subscription, appropriate advance notice will be provided where required by law and users may cancel before the new price applies.",
      },
      {
        title: "12. Payment processing",
        body:
          "Payments may be processed through Stripe or another payment provider. MALX does not normally store full payment-card details. Payment information is processed according to the systems and privacy practices of the payment provider.",
      },
      {
        title: "13. No guarantee of results",
        body:
          "A MALX subscription provides access to additional platform features and analysis only. It does not guarantee prediction accuracy, match outcomes, betting success or financial profit.",
      },
      {
        title: "14. Account termination",
        body:
          "Account suspension or termination for misuse does not remove mandatory consumer rights. The effect of account termination on a subscription may depend on the circumstances and applicable law.",
      },
      {
        title: "15. Consumer rights",
        body:
          "Nothing in these Subscription Terms limits rights that cannot legally be excluded or restricted under applicable consumer protection law in the user's country of residence.",
      },
      {
        title: "16. Billing contact",
        body:
          "For questions about subscriptions, cancellations, billing or refund requests, contact MALX LTD at support@malx.com.",
      },
    ],
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    home: "Back to Home",
  },

  sv: {
    title: "Villkor för abonnemang och uppsägning",
    updated: "Senast uppdaterad: 20 augusti 2026",
    intro:
      "Dessa villkor beskriver reglerna för betalda MALX-abonnemang, inklusive betalning, förnyelse, uppsägning och konsumenträttigheter.",
    sections: [
      {
        title: "1. Tjänsteleverantör",
        body:
          "MALX-abonnemang tillhandahålls av MALX LTD. För frågor om abonnemang eller betalningar kan du kontakta support@malx.com.",
      },
      {
        title: "2. Abonnemangsplaner",
        body:
          "MALX kan erbjuda kostnadsfria och betalda planer såsom Pro och Premium. Pris, faktureringsperiod och viktiga funktioner visas före köp.",
      },
      {
        title: "3. Priser och skatter",
        body:
          "Tillämpligt pris visas innan betalningen genomförs. Skatt eller moms kan tillkomma beroende på kundens plats och tillämplig lag. Slutbeloppet visas före betalningsbekräftelsen när detta krävs.",
      },
      {
        title: "4. Automatisk förnyelse",
        body:
          "Betalda abonnemang kan förnyas automatiskt efter varje faktureringsperiod om de inte sägs upp före förnyelsen. Information om återkommande betalning visas innan köpet slutförs.",
      },
      {
        title: "5. Uppsägning",
        body:
          "Användaren kan stoppa automatisk förnyelse via kontots funktioner för abonnemangshantering. Efter uppsägning är den betalda planen normalt aktiv till slutet av den redan betalda perioden och ingen ny förnyelseavgift tas därefter ut.",
      },
      {
        title: "6. Konsumentens ångerrätt",
        body:
          "Om du som konsument har lagstadgad ångerrätt enligt brittisk, europeisk eller annan tvingande konsumentlagstiftning påverkas inte dessa rättigheter. I vissa situationer kan konsumenten ha en 14 dagars ångerfrist för distansavtal.",
      },
      {
        title: "7. Omedelbar digital tjänst",
        body:
          "Om användaren begär att en betald digital tjänst ska börja tillhandahållas omedelbart efter köpet kan detta enligt tillämplig lag påverka ångerrätten eller det belopp som kan återbetalas. Villkoren begränsar inte rättigheter som inte får avtalas bort.",
      },
      {
        title: "8. Återbetalningar",
        body:
          "Begäran om återbetalning hanteras enligt tvingande konsumenträttigheter, tillämplig lag och omständigheterna kring transaktionen. Policyn begränsar inte någon lagstadgad rätt till återbetalning. Begäran kan skickas till support@malx.com.",
      },
      {
        title: "9. Misslyckad betalning",
        body:
          "Om en abonnemangsbetalning misslyckas kan vi försöka behandla betalningen igen eller be användaren uppdatera betalningsmetoden. Fortsatta betalningsproblem kan leda till att abonnemanget begränsas eller nedgraderas.",
      },
      {
        title: "10. Ändring av plan",
        body:
          "MALX kan tillåta användare att uppgradera eller ändra abonnemangsplan. Tidpunkten för ändringen och eventuell avgift, kredit eller proportionell beräkning kan bero på ändringens typ och betalningsleverantören.",
      },
      {
        title: "11. Prisändringar",
        body:
          "Vi kan ändra abonnemangspriser för framtida faktureringsperioder. Om ändringen påverkar ett befintligt återkommande abonnemang lämnas lämpligt förhandsmeddelande när lagen kräver detta och användaren kan säga upp abonnemanget innan det nya priset börjar gälla.",
      },
      {
        title: "12. Betalningshantering",
        body:
          "Betalningar kan behandlas genom Stripe eller annan betalningsleverantör. MALX lagrar normalt inte fullständiga kortuppgifter och betalningsinformation behandlas enligt betalningsleverantörens system och integritetsrutiner.",
      },
      {
        title: "13. Ingen garanti för resultat",
        body:
          "Ett MALX-abonnemang ger endast tillgång till ytterligare funktioner och analyser. Det innebär ingen garanti för korrekta prognoser, matchresultat, framgång i betting eller ekonomisk vinst.",
      },
      {
        title: "14. Avslutande av konto",
        body:
          "Avstängning eller avslutande av konto på grund av missbruk tar inte bort tvingande konsumenträttigheter. Hur abonnemanget påverkas kan bero på omständigheterna och tillämplig lag.",
      },
      {
        title: "15. Konsumenträttigheter",
        body:
          "Inget i dessa abonnemangsvillkor begränsar rättigheter som enligt konsumentskyddslagstiftningen i användarens bosättningsland inte får uteslutas eller begränsas.",
      },
      {
        title: "16. Kontakt om betalning",
        body:
          "För frågor om abonnemang, uppsägning, fakturering eller återbetalning kan du kontakta MALX LTD på support@malx.com.",
      },
    ],
    terms: "Villkor",
    privacy: "Integritetspolicy",
    home: "Tillbaka till startsidan",
  },
} as const;

export default function SubscriptionTermsPage() {
  const { locale, direction } = useLocale();
  const content = CONTENT[locale];

  return (
    <main
      dir={direction}
      className="min-h-screen bg-[#020617] px-4 py-12 text-white"
    >
      <div className="mx-auto max-w-4xl">
        <header className="rounded-3xl border border-amber-500/20 bg-slate-950/70 p-7 sm:p-10">
          <p className="text-sm font-black tracking-[0.2em] text-amber-400">
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
              <h2 className="text-xl font-black text-amber-300">
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
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-amber-500"
          >
            {content.terms}
          </Link>

          <Link
            href="/privacy"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-amber-500"
          >
            {content.privacy}
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-amber-500"
          >
            {content.home}
          </Link>
        </nav>
      </div>
    </main>
  );
}
