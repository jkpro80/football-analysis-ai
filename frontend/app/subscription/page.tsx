const plans = [
  {
    name: "Free",
    price: "$0",
    period: "مجانا للأبد",
    description: "للمستخدم الذي يريد تجربة التوقعات الأساسية.",
    accent: "emerald",
    badge: null,
    buttonLabel: "ابدأ مجانًا",
    features: [
      { label: "توقعات 1X2 الأساسية", included: true },
      { label: "مركز المباريات", included: true },
      { label: "الإحصائيات الأساسية", included: true },
      { label: "مباريات اليوم والأسبوع", included: true },
      { label: "تحديث البيانات كل 15 دقيقة", included: true },
      { label: "تحليلات متقدمة", included: false },
      { label: "Value Bets", included: false },
      { label: "التنبيهات المباشرة", included: false },
      { label: "توقعات الركنيات والبطاقات", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "شهريًا",
    description: "للمستخدم الجاد الذي يريد تحليلات وتوقعات متقدمة.",
    accent: "cyan",
    badge: "الأكثر شعبية",
    buttonLabel: "اختر خطة Pro",
    features: [
      { label: "كل مميزات الخطة المجانية", included: true },
      { label: "محرك التحليل V7 الكامل", included: true },
      { label: "Value Bets متقدمة", included: true },
      { label: "تحليلات xG وForm وH2H", included: true },
      { label: "توقعات الركنيات", included: true },
      { label: "توقعات البطاقات الصفراء والحمراء", included: true },
      { label: "توقعات الأهداف Over / Under", included: true },
      { label: "توقعات تسجيل الفريقين BTTS", included: true },
      { label: "النتيجة الصحيحة", included: true },
      { label: "Asian Handicap", included: true },
      { label: "حركة السوق والأسعار", included: true },
      { label: "تاريخ التوقعات الكامل", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "حسب الطلب",
    description: "حلول مخصصة للأندية والمؤسسات وشركات البيانات.",
    accent: "amber",
    badge: null,
    buttonLabel: "تواصل معنا",
    features: [
      { label: "كل مميزات Pro", included: true },
      { label: "API كامل وغير محدود", included: true },
      { label: "تقارير مخصصة متقدمة", included: true },
      { label: "دعم فني متخصص 24/7", included: true },
      { label: "مدير حساب مخصص", included: true },
      { label: "تكامل مع أنظمة خارجية", included: true },
      { label: "تحليلات تاريخية غير محدودة", included: true },
      { label: "تدريب ونقل خبرة", included: true },
    ],
  },
] as const;

const comparisonRows = [
  ["توقعات 1X2", true, true, true],
  ["مركز المباريات", true, true, true],
  ["تحليلات متقدمة", false, true, true],
  ["Value Bets", false, true, true],
  ["الإصابات والإيقافات", false, true, true],
  ["الركنيات", false, true, true],
  ["البطاقات", false, true, true],
  ["BTTS", false, true, true],
  ["Over / Under", false, true, true],
  ["النتيجة الصحيحة", false, true, true],
  ["Asian Handicap", false, true, true],
  ["حركة السوق", false, true, true],
  ["API وتقارير مخصصة", false, false, true],
] as const;

const trustItems = [
  {
    title: "أمان وخصوصية",
    description: "حماية بياناتك وإمكانية إلغاء الحساب.",
    icon: "🛡️",
  },
  {
    title: "بيانات دقيقة",
    description: "مصادر موثوقة وبيانات لحظية.",
    icon: "🗄️",
  },
  {
    title: "تحديثات مستمرة",
    description: "إضافة ميزات جديدة بصورة منتظمة.",
    icon: "🚀",
  },
  {
    title: "دعم فني",
    description: "مساعدة سريعة عند الحاجة.",
    icon: "🎧",
  },
  {
    title: "إلغاء في أي وقت",
    description: "لا يوجد التزام طويل المدة.",
    icon: "⏱️",
  },
];

const platformStats = [
  ["وقت التشغيل", "99.9%"],
  ["تحديث البيانات", "كل 15 دقيقة"],
  ["الأسواق المدعومة", "200+"],
  ["المباريات المحللة", "+1,200 يوميًا"],
  ["متوسط الدقة", "85%"],
  ["المستخدمون", "+50,000"],
];

function accentClasses(accent: string) {
  if (accent === "cyan") {
    return {
      border: "border-cyan-400/70",
      title: "text-cyan-300",
      button: "bg-cyan-400 hover:bg-cyan-300 text-slate-950",
      glow: "shadow-[0_0_40px_rgba(34,211,238,0.12)]",
      check: "text-cyan-300",
    };
  }

  if (accent === "amber") {
    return {
      border: "border-amber-500/55",
      title: "text-amber-300",
      button: "bg-amber-500 hover:bg-amber-400 text-slate-950",
      glow: "",
      check: "text-amber-300",
    };
  }

  return {
    border: "border-emerald-500/55",
    title: "text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    glow: "",
    check: "text-emerald-300",
  };
}

export const dynamic = "force-dynamic";

export default function SubscriptionPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#020617] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-black tracking-[0.24em] text-amber-400">
            SUBSCRIPTION CENTER
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            الاشتراكات
          </h1>

          <p className="mt-4 max-w-4xl leading-8 text-slate-400">
            اختر الخطة المناسبة لك واستفد من تحليلات
            احترافية وتوقعات متقدمة تشمل الأهداف،
            الركنيات، البطاقات، الأسواق، وفرص القيمة.
          </p>
        </header>

        <section className="mt-7 grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {trustItems.map((item) => (
            <article
              key={item.title}
              className="flex gap-3 rounded-2xl border border-slate-800/80 bg-[#071023] p-4"
            >
              <span className="text-2xl">
                {item.icon}
              </span>

              <div>
                <h2 className="font-black">
                  {item.title}
                </h2>

                <p className="mt-1 text-xs leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const styles = accentClasses(plan.accent);

            return (
              <article
                key={plan.name}
                className={`relative flex min-h-[620px] flex-col rounded-3xl border bg-slate-950/65 p-7 ${styles.border} ${styles.glow}`}
              >
                {plan.badge ? (
                  <span className="absolute right-1/2 top-0 translate-x-1/2 -translate-y-1/2 rounded-b-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">
                    {plan.badge}
                  </span>
                ) : null}

                <div className="text-center">
                  <h2 className={`text-3xl font-black ${styles.title}`}>
                    {plan.name}
                  </h2>

                  <p className="mt-3 text-5xl font-black">
                    {plan.price}
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-400">
                    {plan.period}
                  </p>

                  <p className="mt-4 leading-7 text-slate-500">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-start gap-3 text-sm leading-7"
                    >
                      <span
                        className={
                          feature.included
                            ? styles.check
                            : "text-red-400"
                        }
                      >
                        {feature.included ? "✓" : "✕"}
                      </span>

                      <span
                        className={
                          feature.included
                            ? "text-slate-200"
                            : "text-slate-600"
                        }
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`mt-7 w-full rounded-xl px-5 py-3 font-black transition ${styles.button}`}
                >
                  {plan.buttonLabel}
                </button>
              </article>
            );
          })}
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/65">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-black">
              مقارنة المميزات
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              مقارنة مباشرة بين الخطط الثلاث.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-sm">
              <thead className="bg-[#071023]">
                <tr>
                  <th className="px-5 py-4 text-right">
                    الميزة
                  </th>
                  <th className="px-5 py-4 text-center text-emerald-300">
                    Free
                  </th>
                  <th className="px-5 py-4 text-center text-cyan-300">
                    Pro
                  </th>
                  <th className="px-5 py-4 text-center text-amber-300">
                    Enterprise
                  </th>
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map(
                  ([feature, free, pro, enterprise]) => (
                    <tr
                      key={feature}
                      className="border-t border-slate-800/80"
                    >
                      <td className="px-5 py-4 font-bold text-slate-300">
                        {feature}
                      </td>

                      {[free, pro, enterprise].map(
                        (value, index) => (
                          <td
                            key={`${feature}-${index}`}
                            className="px-5 py-4 text-center"
                          >
                            <span
                              className={
                                value
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }
                            >
                              {value ? "✓" : "✕"}
                            </span>
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/65 p-5 sm:grid-cols-2 lg:grid-cols-6">
          {platformStats.map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-800 bg-[#071023] p-4 text-center"
            >
              <p className="text-xs font-bold text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-xl font-black text-cyan-300">
                {value}
              </p>
            </article>
          ))}
        </section>

        <footer className="mt-12 border-t border-slate-800 py-7 text-center text-sm text-slate-600">
          Football Analysis AI — Subscription Center
        </footer>
      </div>
    </main>
  );
}