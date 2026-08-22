import type { Metadata } from "next";
import Hero from "@/components/Hero";
import TrustedBrands from "@/components/TrustedBrands";
import Services from "@/components/Services";
import Reviews from "@/components/Reviews";
import About from "@/components/About";
import Insights from "@/components/Insights";
import Contact from "@/components/Contact";
import FooterTranslated from "@/components/FooterTranslated";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const alternates = localizedAlternates("/", locale);
  return {
    alternates,
    openGraph: { url: alternates.canonical },
  };
}

export default function Home() {
  return (
    <main>
      <Hero />
      <TrustedBrands />
      <Services />
      <Reviews />
      <About />
      <Insights />
      <Contact />
      <FooterTranslated />
    </main>
  );
}
