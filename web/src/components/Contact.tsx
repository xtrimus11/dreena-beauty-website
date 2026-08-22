"use client";

import { useLocale, useTranslations } from "next-intl";
import MagneticButton from "./MagneticButton";

export default function Contact() {
  const t = useTranslations("home.contactCta");
  const locale = useLocale();
  const skinAnalysisHref = locale === "en" ? "/skin-analysis" : `/${locale}/skin-analysis`;

  return (
    <section className="relative overflow-hidden border-t border-border bg-champagne py-40 text-foreground">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 animate-pulse rounded-full bg-taupe/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 animate-pulse rounded-full bg-taupe/25 blur-3xl [animation-delay:1s]" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <h2 className="text-balance text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
          {t("heading")}
        </h2>
        <p className="mt-6 max-w-md text-base text-foreground/70">{t("body")}</p>

        <MagneticButton
          href={skinAnalysisHref}
          className="mt-12 inline-block rounded-full bg-taupe-dark px-10 py-5 text-sm font-medium uppercase tracking-[0.14em] text-cream transition-transform"
        >
          {t("button")}
        </MagneticButton>
      </div>
    </section>
  );
}
