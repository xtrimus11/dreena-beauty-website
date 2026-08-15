"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const PHRASES = ["Dermalogica Certified", "40 Years of Trust", "Largest in Seremban"];

function useTypingCycle(phrases: string[]) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index];
    const typingSpeed = deleting ? 35 : 65;
    const holdAtFull = 1600;
    const holdAtEmpty = 300;

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), holdAtFull);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      const t = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      }, holdAtEmpty);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setText(current.slice(0, deleting ? text.length - 1 : text.length + 1));
    }, typingSpeed);
    return () => clearTimeout(t);
  }, [text, deleting, index, phrases]);

  return text;
}

export default function Hero() {
  const typed = useTypingCycle(PHRASES);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-scrim text-cream">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-[0.85] mix-blend-luminosity"
        src="/video/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Halftone dot overlay — printed-ink texture */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backgroundImage:
            "radial-gradient(rgba(247,241,231,0.9) 1px, transparent 1px)",
          backgroundSize: "5px 5px",
          mixBlendMode: "overlay",
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      {/* Warm scrim — champagne/taupe tint instead of a cold black overlay,
          just enough contrast to keep the headline readable. */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-scrim/35 via-taupe-dark/10 to-scrim/55" />
      <div className="absolute inset-0 z-10 bg-champagne/10 mix-blend-overlay" />

      <div className="relative z-20 flex flex-col items-center px-6 text-center">
        <span className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-cream/75">
          Seremban&apos;s Beauty House Since 1987
        </span>

        <h1 className="text-balance whitespace-nowrap text-[clamp(2.5rem,10vw,6.5rem)] font-medium leading-[0.95] tracking-tight text-cream">
          Real Skin. Real Results.
        </h1>

        <div className="mt-8 flex h-8 items-center text-base font-medium uppercase tracking-[0.18em] text-champagne md:text-lg">
          <span>{typed}</span>
          <span className="ml-1 inline-block h-[1em] w-[2px] animate-[blink_1s_steps(1)_infinite] bg-champagne" />
        </div>
      </div>

      <div className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-cream/60">
        <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
        <ChevronDown size={18} className="animate-bounce" />
      </div>

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
