"use client";

import { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { TREATMENTS } from "@/data/treatments";

// Photo/slug/credit come from data/treatments.ts (unchanged); display text
// (name, tagline, category, duration, summary) is overlaid from messages so
// it's translated. Treatment detail pages themselves aren't translated, so
// the "View Treatment" destination stays a plain, unprefixed link.
export default function Services() {
  const t = useTranslations("treatmentsHome");
  const tHome = useTranslations("home.services");
  const [active, setActive] = useState(0);

  const items = TREATMENTS.map((item) => ({
    ...item,
    name: t(`${item.slug}.name`),
    tagline: t(`${item.slug}.tagline`),
    category: t(`${item.slug}.category`),
    duration: t(`${item.slug}.duration`),
    summary: t(`${item.slug}.summary`),
  }));

  const current = items[active];

  return (
    <section className="border-t border-border bg-background px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {tHome("kicker")}
          </span>
          <h2 className="mt-4 text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
            {tHome("heading")}
          </h2>

          <ul className="mt-14 flex flex-col border-t border-border">
            {items.map((item, i) => (
              <li key={item.slug} className="border-b border-border">
                <NextLink
                  href={`/treatments/${item.slug}`}
                  onMouseEnter={() => setActive(i)}
                  className="group flex items-center justify-between gap-6 py-6"
                >
                  <div>
                    <div className="flex items-baseline">
                      <span className="mr-4 text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                      <span
                        className={`text-2xl font-medium tracking-tight transition-colors duration-300 md:text-3xl ${
                          active === i ? "text-foreground" : "text-muted group-hover:text-foreground"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <p className="mt-1.5 pl-10 text-sm text-muted">{item.tagline}</p>
                  </div>
                  <ArrowUpRight
                    size={20}
                    className={`shrink-0 transition-all duration-300 ${
                      active === i ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    }`}
                  />
                </NextLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-7">
          <div className="sticky top-28 h-[60vh] overflow-hidden rounded-sm bg-background-secondary md:h-[70vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.slug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={current.photo}
                  alt={current.name}
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                  priority={active === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-background md:p-12">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-background/70">
                    {current.category} · {current.duration}
                  </span>
                  <p className="mt-3 max-w-md text-lg leading-snug">{current.summary}</p>
                  {current.photoCredit && current.photoCreditHref && (
                    <a
                      href={current.photoCreditHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-[11px] text-background/50 hover:text-background/80"
                    >
                      {current.photoCredit}
                    </a>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
