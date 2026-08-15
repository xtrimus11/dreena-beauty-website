"use client";

import { Sparkles, Zap, Waves, Droplet, ShieldCheck, Leaf } from "lucide-react";

const ITEMS = [
  { icon: Sparkles, label: "Dermalogica" },
  { icon: Zap, label: "HIFU Ultratherapy" },
  { icon: Waves, label: "SnowLight Pico Laser" },
  { icon: Droplet, label: "Oxygen Technology" },
  { icon: ShieldCheck, label: "Meso-RF" },
  { icon: Leaf, label: "Ionto-Infusion" },
];

export default function TrustedBrands() {
  const row = [...ITEMS, ...ITEMS];

  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent md:w-40" />

      <div className="group flex w-max">
        <div className="flex animate-marquee items-center gap-16 pr-16 group-hover:[animation-play-state:paused]">
          {row.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={`${item.label}-${i}`}
                className="flex shrink-0 items-center gap-3 text-taupe transition-colors duration-300 hover:text-taupe-dark"
              >
                <Icon size={22} strokeWidth={1.5} />
                <span className="whitespace-nowrap text-sm font-medium uppercase tracking-[0.12em]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
