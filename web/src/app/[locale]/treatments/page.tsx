import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CATEGORIES, TREATMENTS } from "@/data/allTreatments";
import TreatmentCategorySection from "@/components/TreatmentCategorySection";
import FooterTranslated from "@/components/FooterTranslated";
import JsonLd from "@/components/JsonLd";
import { Link } from "@/i18n/navigation";
import { breadcrumbJsonLd, localizedAlternates, servicesJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "treatmentsPage.meta" });
  const description = t("description", { count: TREATMENTS.length });
  const alternates = localizedAlternates("/treatments", locale);
  return {
    title: t("title"),
    description,
    alternates,
    openGraph: { title: t("title"), description, url: alternates.canonical },
    twitter: { title: t("title"), description },
  };
}

export default async function TreatmentsPage() {
  const t = await getTranslations("treatmentsPage");

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
          {t("kicker")}
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
          {t("heading", { count: TREATMENTS.length })}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-base text-muted">
          {t("notSure")}{" "}
          <Link href="/skin-analysis" className="text-foreground underline underline-offset-4">
            {t("takeSkinAnalysis")}
          </Link>{" "}
          {t("forRecommendation")}
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <TreatmentCategorySection
          key={category}
          category={category}
          treatments={TREATMENTS.filter((tr) => tr.category === category)}
        />
      ))}

      <FooterTranslated />
    </main>
  );
}
