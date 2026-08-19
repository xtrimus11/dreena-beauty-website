import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TREATMENTS } from "@/data/allTreatments";
import TreatmentCategorySection from "@/components/TreatmentCategorySection";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, servicesJsonLd } from "@/lib/seo";

const TITLE = "Treatments";
const DESCRIPTION = `${TREATMENTS.length} treatments organised by skin type — Dermalogica-certified facials and advanced technology for every skin concern.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/treatments" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/treatments" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function TreatmentsPage() {
  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Treatments", path: "/treatments" }]),
          servicesJsonLd(TREATMENTS),
        ]}
      />
      <div className="px-6 pt-40 text-center md:px-10 md:pt-48">
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
          Treatments
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
          {TREATMENTS.length} treatments, organised by skin type.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-muted">
          Not sure where to start?{" "}
          <Link href="/skin-analysis" className="text-foreground underline underline-offset-4">
            Take the Skin Analysis
          </Link>{" "}
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
