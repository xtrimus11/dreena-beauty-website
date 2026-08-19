import type { Metadata } from "next";
import FounderHero from "@/components/FounderHero";
import SecondGenFounders from "@/components/SecondGenFounders";
import About from "@/components/About";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

const TITLE = "About";
const DESCRIPTION =
  "Meet Dareena, founder of d'reena beauty since 1987, and Shaun & Elaine, the second generation educating customers and reinventing our treatments.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/about" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function AboutPage() {
  return (
    <main>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <FounderHero />
      <SecondGenFounders />
      <About />
      <Footer />
    </main>
  );
}
