import type { Metadata } from "next";
import { CATEGORIES, TREATMENTS } from "@/data/allTreatments";
import TreatmentCategorySection from "@/components/TreatmentCategorySection";
import Footer from "@/components/Footer";
import { LIVE_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Treatments — d'reena beauty",
  description:
    "23 treatments organised by skin type — Dermalogica-certified facials and advanced technology for every skin concern.",
};

export default function TreatmentsPage() {
  return (
    <main>
      <div className="px-6 pt-40 text-center md:px-10 md:pt-48">
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
          Treatments
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
          23 treatments, organised by skin type.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-muted">
          Not sure where to start?{" "}
          <a
            href={LIVE_LINKS.skinAnalysis}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            Take the Skin Analysis
          </a>{" "}
          for a recommendation based on your skin.
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <TreatmentCategorySection
          key={category}
          category={category}
          treatments={TREATMENTS.filter((t) => t.category === category)}
        />
      ))}

      <Footer />
    </main>
  );
}
