import type { Metadata } from "next";
import FounderHero from "@/components/FounderHero";
import About from "@/components/About";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — d'reena beauty",
  description:
    "Meet Dareena, founder of d'reena beauty — Seremban's beauty house since 1987.",
};

export default function AboutPage() {
  return (
    <main>
      <FounderHero />
      <About />
      <Footer />
    </main>
  );
}
