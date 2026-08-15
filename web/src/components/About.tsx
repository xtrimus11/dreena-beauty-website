"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

const MANIFESTO =
  "We believe skin care should never be generic. Every treatment starts with understanding your skin's true condition — not a one-size routine, but a plan built around your specific concerns. For forty years that has meant real technology, real results, and real care, from Seremban's largest Dermalogica-certified clinic.";

export default function About() {
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!textRef.current) return;

    const split = new SplitType(textRef.current, { types: "words" });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        split.words,
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
  }, []);

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-32 md:px-10 md:py-48">
        <span className="mb-10 block text-xs font-medium uppercase tracking-[0.25em] text-muted">
          Our Vision
        </span>
        <p
          ref={textRef}
          className="text-balance text-3xl font-medium leading-[1.3] tracking-tight text-foreground md:text-5xl"
        >
          {MANIFESTO}
        </p>
      </div>

      <div className="overflow-hidden border-y border-border py-8">
        <div className="flex w-max animate-marquee-slow items-center gap-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-5xl font-medium uppercase tracking-tight text-taupe-dark md:text-7xl"
            >
              Real Skin Care. Real Results.&nbsp;
              <span className="mx-8 inline-block text-taupe">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
