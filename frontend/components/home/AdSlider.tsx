"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/context/locale-context";

const slides = [
  {
    src: "/ads/ad-slide-1.png",
    alt: "Football Analysis AI promotional banner 1",
  },
  {
    src: "/ads/ad-slide-2.png",
    alt: "Football Analysis AI promotional banner 2",
  },
  {
    src: "/ads/ad-slide-3.png",
    alt: "Football Analysis AI promotional banner 3",
  },
];

export default function AdSlider() {
  const { locale } = useLocale();

  const [current, setCurrent] = useState(0);

  const t =
    locale === "ar"
      ? {
          previous: "الإعلان السابق",
          next: "الإعلان التالي",
          goTo: (number: number) =>
            `الانتقال إلى الإعلان ${number}`,
        }
      : locale === "sv"
        ? {
            previous: "Föregående annons",
            next: "Nästa annons",
            goTo: (number: number) =>
              `Gå till annons ${number}`,
          }
        : {
            previous: "Previous advertisement",
            next: "Next advertisement",
            goTo: (number: number) =>
              `Go to advertisement ${number}`,
          };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent(
        (value) => (value + 1) % slides.length,
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  function previousSlide() {
    setCurrent(
      (value) =>
        (value - 1 + slides.length) %
        slides.length,
    );
  }

  function nextSlide() {
    setCurrent(
      (value) => (value + 1) % slides.length,
    );
  }

  return (
    <section className="mt-7">
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-500/20 bg-slate-950">
        <div className="relative aspect-[1672/314] w-full">
          <img
            src={slides[current].src}
            alt={slides[current].alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <button
          type="button"
          onClick={previousSlide}
          aria-label={t.previous}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-2xl text-white backdrop-blur transition hover:bg-slate-900"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label={t.next}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-2xl text-white backdrop-blur transition hover:bg-slate-900"
        >
          ›
        </button>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={t.goTo(index + 1)}
              className={`h-2.5 rounded-full transition-all ${
                index === current
                  ? "w-8 bg-cyan-400"
                  : "w-2.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}






