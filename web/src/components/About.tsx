"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

export default function About() {
  const t = useTranslations("about.vision");
  const locale = useLocale();
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!textRef.current) return;

    // Chinese has no whitespace between words, so splitting by "words"
    // would treat the whole sentence as one unit — split by character
    // there instead for a comparable stagger effect.
    const split = new SplitType(textRef.current, {
      types: locale === "zh" ? "chars" : "words",
    });
    const units = locale === "zh" ? split.chars : split.words;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        units,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 75%",
            end: "bottom 45%",
            scrub: 1,
          },
        }
      );
    });

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [locale]);

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-32 md:px-10 md:py-48">
        <span className="mb-10 block text-xs font-medium uppercase tracking-[0.25em] text-muted">
          {t("kicker")}
        </span>
        <p
          ref={textRef}
          className="text-balance text-3xl font-medium leading-[1.3] tracking-tight text-foreground md:text-5xl"
        >
          {t("manifesto")}
        </p>
      </div>

      <div className="overflow-hidden border-y border-border py-8">
        <div className="flex w-max animate-marquee-slow items-center gap-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-5xl font-medium uppercase tracking-tight text-taupe-dark md:text-7xl"
            >
              {t("marquee")}&nbsp;
              <span className="mx-8 inline-block text-taupe">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
