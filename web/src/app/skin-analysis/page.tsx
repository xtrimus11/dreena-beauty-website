import type { Metadata } from "next";
import SkinAnalysisQuiz from "@/components/SkinAnalysisQuiz";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Skin Analysis — d'reena beauty",
  description:
    "Find your skin type and treatment — upload a photo (optional) and answer 6 quick questions for a personalised recommendation.",
};

export default function SkinAnalysisPage() {
  return (
    <main>
      <SkinAnalysisQuiz />
      <Footer />
    </main>
  );
}
