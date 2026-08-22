import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FounderHero from "@/components/FounderHero";
import SecondGenFounders from "@/components/SecondGenFounders";
import About from "@/components/About";
import FooterTranslated from "@/components/FooterTranslated";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, localizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  const alternates = localizedAlternates("/about", locale);
  return {
    title: t("title"),
    description: t("description"),
    alternates,
    openGraph: { title: t("title"), description: t("description"), url: alternates.canonical },
    twitter: { title: t("title"), description: t("description") },
  };
}

export default function AboutPage() {
  return (
    <main>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <FounderHero />
      <SecondGenFounders />
      <About />
      <FooterTranslated />
    </main>
  );
}
