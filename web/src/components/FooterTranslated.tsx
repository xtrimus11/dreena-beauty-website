"use client";

import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { WHATSAPP_URL } from "@/lib/site";

// Same as Footer.tsx, but for the six translated pages — same
// localized-vs-plain link split as NavbarTranslated.
export default function FooterTranslated() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const EXPLORE = [
    { label: nav("treatments"), href: "/treatments", localized: true },
    { label: nav("skinAnalysis"), href: "/skin-analysis", localized: true },
    { label: t("aboutUs"), href: "/about", localized: true },
    { label: nav("dermalogica"), href: "/dermalogica", localized: true },
    { label: nav("blog"), href: "/blog", localized: false },
  ];

  return (
    <footer className="border-t border-border bg-background px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="text-sm font-medium uppercase tracking-[0.2em]">d&apos;reena</span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t("tagline")}</p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
            {t("explore")}
          </span>
          <div className="mt-4 flex flex-col gap-3">
            {EXPLORE.map((l) =>
              l.localized ? (
                <Link
                  key={l.href}
                  href={l.href}
                  className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <NextLink
                  key={l.href}
                  href={l.href}
                  className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </NextLink>
              )
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
            {t("visit")}
          </span>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/contact" className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground">
              Uptown Avenue, Seremban 2
            </Link>
            <Link href="/contact" className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground">
              Taipan 2, Senawang
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              WhatsApp: +60 16-213 0864
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[1600px] border-t border-border pt-6 text-xs text-muted">
        {t("copyright")}
      </div>
    </footer>
  );
}
