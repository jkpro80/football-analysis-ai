"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type HeroSlide = {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tertiaryLabel?: string;
  tertiaryHref?: string;
  metricLabel: string;
  metricValue: string;
  metricCaption: string;
  theme: "cyan" | "amber" | "emerald" | "violet" | "rose";
};

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 1,
    eyebrow: "FOOTBALL ANALYSIS AI",
    title: "افتح جميع قدرات محرك التوقعات V7",
    description:
      "تحليلات متقدمة للأهداف، الركنيات، البطاقات، BTTS، Value Bets والنتيجة الصحيحة.",
    primaryLabel: "الترقية إلى Pro",
    primaryHref: "/subscription",
    secondaryLabel: "عرض التوقعات",
    secondaryHref: "/predictions",
    tertiaryLabel: "تحليل مباراة",
    tertiaryHref: "/fixtures",
    metricLabel: "AI Confidence",
    metricValue: "91%",
    metricCaption: "Today's Best Pick",
    theme: "cyan",
  },
  {
    id: 2,
    eyebrow: "MATCH OF THE DAY",
    title: "أفضل مباريات اليوم في مكان واحد",
    description:
      "تابع نسب الفوز، مستوى الثقة، xG وأفضل الأسواق المقترحة قبل بداية المباراة.",
    primaryLabel: "استعراض المباريات",
    primaryHref: "/fixtures",
    secondaryLabel: "عرض التوقعات",
    secondaryHref: "/predictions",
    tertiaryLabel: "المباريات المباشرة",
    tertiaryHref: "/live",
    metricLabel: "Today's Matches",
    metricValue: "62",
    metricCaption: "Across Major Leagues",
    theme: "amber",
  },
  {
    id: 3,
    eyebrow: "VALUE BETS",
    title: "اكتشف فرص القيمة قبل تحرك السوق",
    description:
      "قارن الاحتمال المتوقع بالسعر المتاح واعثر على الفرص التي يمنحها المحرك أفضل قيمة.",
    primaryLabel: "عرض Value Bets",
    primaryHref: "/value-bets",
    secondaryLabel: "الإحصائيات",
    secondaryHref: "/statistics",
    tertiaryLabel: "تحليل مباراة",
    tertiaryHref: "/fixtures",
    metricLabel: "Top Value",
    metricValue: "+18%",
    metricCaption: "Expected Advantage",
    theme: "emerald",
  },
  {
    id: 4,
    eyebrow: "NEW MARKETS",
    title: "توقعات الركنيات والبطاقات وAsian Handicap",
    description:
      "أسواق إضافية ستعمل ضمن محرك V7 مع درجة ثقة وشرح واضح لأسباب كل توقع.",
    primaryLabel: "شاهد المميزات",
    primaryHref: "/subscription",
    secondaryLabel: "استكشف الدوريات",
    secondaryHref: "/leagues",
    tertiaryLabel: "المباريات المباشرة",
    tertiaryHref: "/live",
    metricLabel: "Markets",
    metricValue: "200+",
    metricCaption: "Supported Markets",
    theme: "violet",
  },
  {
    id: 5,
    eyebrow: "COMING SOON",
    title: "مساعد ذكي لتحليل المباراة خطوة بخطوة",
    description:
      "اسأل عن الفريقين، التشكيلة، الإصابات، الأداء الأخير وأفضل السيناريوهات المتوقعة.",
    primaryLabel: "استكشف المنصة",
    primaryHref: "/",
    secondaryLabel: "حسابي",
    secondaryHref: "/profile",
    tertiaryLabel: "تحليل مباراة",
    tertiaryHref: "/fixtures",
    metricLabel: "AI Assistant",
    metricValue: "SOON",
    metricCaption: "Explainable Analysis",
    theme: "rose",
  },
];

const themeClasses = {
  cyan: {
    glow: "from-cyan-500/25 via-blue-500/10 to-transparent",
    chip: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    button: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    metric: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    dot: "bg-cyan-400",
  },
  amber: {
    glow: "from-amber-500/25 via-orange-500/10 to-transparent",
    chip: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    button: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    metric: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    dot: "bg-amber-400",
  },
  emerald: {
    glow: "from-emerald-500/25 via-teal-500/10 to-transparent",
    chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    button: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
    metric: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  violet: {
    glow: "from-violet-500/25 via-fuchsia-500/10 to-transparent",
    chip: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    button: "bg-violet-400 text-slate-950 hover:bg-violet-300",
    metric: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    dot: "bg-violet-400",
  },
  rose: {
    glow: "from-rose-500/25 via-pink-500/10 to-transparent",
    chip: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    button: "bg-rose-400 text-slate-950 hover:bg-rose-300",
    metric: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    dot: "bg-rose-400",
  },
} as const;

type HeroSliderProps = {
  slides?: HeroSlide[];
  autoPlayMs?: number;
};

export default function HeroSlider({
  slides = DEFAULT_SLIDES,
  autoPlayMs = 6000,
}: HeroSliderProps) {
  const safeSlides = useMemo(
    () => (slides.length > 0 ? slides : DEFAULT_SLIDES),
    [slides],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      setActiveIndex(
        (index + safeSlides.length) % safeSlides.length,
      );
    },
    [safeSlides.length],
  );

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrevious = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    if (isPaused || safeSlides.length < 2) {
      return;
    }

    const timer = window.setInterval(goNext, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [autoPlayMs, goNext, isPaused, safeSlides.length]);

  const activeSlide = safeSlides[activeIndex];
  const colors = themeClasses[activeSlide.theme];

  return (
    <section
      dir="rtl"
      aria-label="الإعلانات والعروض"
      className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#071023] shadow-2xl shadow-black/20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-l ${colors.glow}`}
      />

      {/* Football field lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.045]">
        <div className="absolute inset-x-[8%] inset-y-[12%] rounded-[28px] border-2 border-white" />
        <div className="absolute left-1/2 top-[12%] h-[76%] w-px -translate-x-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        <div className="absolute right-[8%] top-1/2 h-36 w-20 -translate-y-1/2 border-2 border-r-0 border-white" />
        <div className="absolute left-[8%] top-1/2 h-36 w-20 -translate-y-1/2 border-2 border-l-0 border-white" />
      </div>

      {/* Tactical grid and ball */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute -left-14 -top-14 h-48 w-48 rounded-full border border-white/10 bg-white/[0.02]" />
      <div className="pointer-events-none absolute bottom-[-55px] right-[42%] h-44 w-44 rounded-full border border-white/10 bg-white/[0.02]" />

      <div className="relative grid min-h-[240px] items-center gap-6 px-5 py-6 sm:min-h-[280px] sm:px-8 lg:min-h-[320px] lg:grid-cols-[1fr_220px] lg:px-10">
        <div
          key={activeSlide.id}
          className="animate-[fadeIn_.45s_ease-out]"
        >
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.18em] ${colors.chip}`}
          >
            {activeSlide.eyebrow}
          </span>

          <h2 className="mt-4 max-w-3xl text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl">
            {activeSlide.title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {activeSlide.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={activeSlide.primaryHref}
              className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${colors.button}`}
            >
              {activeSlide.primaryLabel}
            </Link>

            {activeSlide.secondaryLabel &&
            activeSlide.secondaryHref ? (
              <Link
                href={activeSlide.secondaryHref}
                className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-sm font-black text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                {activeSlide.secondaryLabel}
              </Link>
            ) : null}

            {activeSlide.tertiaryLabel &&
            activeSlide.tertiaryHref ? (
              <Link
                href={activeSlide.tertiaryHref}
                className="rounded-xl border border-slate-700/70 bg-transparent px-4 py-2.5 text-sm font-black text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                {activeSlide.tertiaryLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:block">
          <div
            className={`mx-auto flex min-h-[170px] max-w-[200px] flex-col items-center justify-center rounded-3xl border p-5 text-center backdrop-blur ${colors.metric}`}
          >
            <span className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
              {activeSlide.metricLabel}
            </span>

            <strong className="mt-2 text-4xl font-black">
              {activeSlide.metricValue}
            </strong>

            <span className="mt-2 text-xs font-bold opacity-70">
              {activeSlide.metricCaption}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-slate-800/80 bg-slate-950/35 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          {safeSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`الانتقال إلى الإعلان ${index + 1}`}
              aria-current={
                index === activeIndex ? "true" : undefined
              }
              className={`h-3 rounded-full transition-all duration-500 ${
                index === activeIndex
                  ? `w-9 ${colors.dot}`
                  : "w-3 bg-slate-600 hover:scale-110 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevious}
            aria-label="الإعلان السابق"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-700 bg-slate-950/60 text-lg text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="الإعلان التالي"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-700 bg-slate-950/60 text-lg text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}