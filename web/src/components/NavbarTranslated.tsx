"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { WHATSAPP_URL } from "@/lib/site";
import LanguageSwitcher from "./LanguageSwitcher";

// Same as Navbar.tsx, but for the six translated pages: labels come from
// messages, and the link to Blog (still untranslated) uses plain next/link
// with a plain href — that page has no locale prefix — while everything
// else uses the locale-aware Link so the current language carries over.
export default function NavbarTranslated() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const LINKS = [
    { label: t("treatments"), href: "/treatments", localized: true },
    { label: t("skinAnalysis"), href: "/skin-analysis", localized: true },
    { label: t("about"), href: "/about", localized: true },
    { label: t("dermalogica"), href: "/dermalogica", localized: true },
    { label: t("blog"), href: "/blog", localized: false },
    { label: t("contact"), href: "/contact", localized: true },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled ? "backdrop-blur-md bg-background/80 border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" className="text-sm font-medium uppercase tracking-[0.2em] text-foreground">
            d&apos;reena
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {LINKS.map((link) =>
              link.localized ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative text-xs font-medium uppercase tracking-[0.14em] text-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </Link>
              ) : (
                <NextLink
                  key={link.href}
                  href={link.href}
                  className="group relative text-xs font-medium uppercase tracking-[0.14em] text-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-foreground transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </NextLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher className="hidden md:flex" />
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-foreground/20 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background md:inline-block"
            >
              {t("whatsappUs")}
            </a>
            <button
              aria-label={open ? t("closeMenu") : t("openMenu")}
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center md:hidden"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col items-start justify-center gap-6 bg-background px-8 md:hidden"
          >
            {LINKS.map((link, i) =>
              link.localized ? (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-4xl font-medium tracking-tight text-foreground"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NextLink
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-4xl font-medium tracking-tight text-foreground"
                  >
                    {link.label}
                  </NextLink>
                </motion.div>
              )
            )}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * LINKS.length, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 flex items-center gap-6"
            >
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="rounded-full border border-foreground/20 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-foreground"
              >
                {t("whatsappUs")}
              </a>
              <LanguageSwitcher />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
