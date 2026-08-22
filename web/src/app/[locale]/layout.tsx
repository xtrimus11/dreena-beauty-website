import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import NavbarTranslated from "@/components/NavbarTranslated";
import LocaleHtmlSync from "@/components/LocaleHtmlSync";

// Wraps Home, Skin Analysis, About, and Contact — the four translated
// pages. Locale-aware Navbar + NextIntlClientProvider live here.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <LocaleHtmlSync locale={locale} />
      <NavbarTranslated />
      {children}
    </NextIntlClientProvider>
  );
}
