import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SkinAnalysisQuiz from "@/components/SkinAnalysisQuiz";
import FooterTranslated from "@/components/FooterTranslated";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, localizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "skinAnalysis.meta" });
  const alternates = localizedAlternates("/skin-analysis", locale);
  return {
    title: t("title"),
    description: t("description"),
    alternates,
    openGraph: { title: t("title"), description: t("description"), url: alternates.canonical },
    twitter: { title: t("title"), description: t("description") },
  };
}

export default function SkinAnalysisPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Skin Analysis", path: "/skin-analysis" }])}
      />
      <SkinAnalysisQuiz />
      <FooterTranslated />
    </main>
  );
}
