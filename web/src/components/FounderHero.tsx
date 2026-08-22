"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, MessageCircle, Star } from "lucide-react";
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT, GOOGLE_MAPS_URL } from "@/data/reviews";
import { WHATSAPP_URL } from "@/lib/site";

const AVATAR_INITIALS = ["V", "K", "N"];

export default function FounderHero() {
  const t = useTranslations("about.founderHero");

  return (
    <section className="bg-portrait-bg px-6 pb-20 pt-40 md:px-10 md:pb-28 md:pt-48">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(0,420px)_1fr] lg:items-center lg:gap-8">
        {/* Left — headline, CTA, rating */}
        <div className="flex flex-col items-start">
          <h1 className="text-balance text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-[3.25rem]">
            {t("slogan1")}
            <br />
            {t("slogan2")}
            <br />
            {t("slogan3")}
            <br />
            {t("slogan4")}
          </h1>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-3"
          >
            <span className="text-base font-medium text-foreground">{t("bookACall")}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cream text-taupe-dark transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight size={16} />
            </span>
          </a>

          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-16 block w-fit"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  strokeWidth={1.5}
                  className={
                    i < Math.round(GOOGLE_RATING)
                      ? "fill-taupe-dark text-taupe-dark"
                      : "text-foreground/20"
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              {t("ratingLine", { rating: GOOGLE_RATING })}
              <br />
              {t("ratingLine2", { count: GOOGLE_REVIEW_COUNT })}
            </p>
          </a>
        </div>

        {/* Center — founder photo */}
        <div>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm">
            <Image
              src="/images/founder.jpg"
              alt="Dareena, founder of d'reena beauty"
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Right — bio, contact, social proof */}
        <div className="flex flex-col items-start lg:items-end lg:text-right">
          <p className="text-base text-foreground">{t("bio")}</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-sm font-medium text-foreground transition-colors hover:border-foreground"
          >
            <MessageCircle size={16} />
            {t("whatsapp")}
          </a>

          <div className="mt-16 flex flex-col items-start lg:items-end">
            <div className="flex -space-x-3">
              {AVATAR_INITIALS.map((letter) => (
                <div
                  key={letter}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-portrait-bg bg-cream text-sm font-medium text-taupe-dark"
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-[26ch] text-balance text-sm italic text-foreground/70">
              {t("reviewQuote")}
            </p>
            <span className="mt-1 text-xs text-foreground/50">{t("reviewAttribution")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
