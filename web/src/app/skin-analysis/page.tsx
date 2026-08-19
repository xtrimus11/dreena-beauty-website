import type { Metadata } from "next";
import SkinAnalysisQuiz from "@/components/SkinAnalysisQuiz";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

const TITLE = "Skin Analysis";
const DESCRIPTION =
  "Find your skin type and treatment — upload a photo (optional) and answer 6 quick questions for a personalised recommendation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/skin-analysis" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/skin-analysis" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function SkinAnalysisPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Skin Analysis", path: "/skin-analysis" }])}
      />
      <SkinAnalysisQuiz />
      <Footer />
    </main>
  );
}
