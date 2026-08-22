import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import FooterTranslated from "@/components/FooterTranslated";
import JsonLd from "@/components/JsonLd";
import { WHATSAPP_URL } from "@/lib/site";
import { GOOGLE_MAPS_URL, SENAWANG_GOOGLE_MAPS_URL } from "@/data/reviews";
import { breadcrumbJsonLd, localBusinessesJsonLd, localizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const alternates = localizedAlternates("/contact", locale);
  return {
    title: t("heading"),
    description: t("subheading"),
    alternates,
    openGraph: { title: t("heading"), description: t("subheading"), url: alternates.canonical },
    twitter: { title: t("heading"), description: t("subheading") },
  };
}

const LOCATIONS = [
  {
    name: "d'reena beauty centre",
    address: "Uptown Avenue, Seremban 2, Negeri Sembilan",
    whatsappHref: "https://wa.me/60122192247",
    directionsHref: GOOGLE_MAPS_URL,
  },
  {
    name: "d'sensations beauty",
    address: "Taipan 2, Senawang, Negeri Sembilan",
    whatsappHref: "https://wa.me/60189188664",
    directionsHref: SENAWANG_GOOGLE_MAPS_URL,
  },
];

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]),
          ...localBusinessesJsonLd(),
        ]}
      />
      <div className="px-6 pb-8 pt-40 md:px-10 md:pt-48">
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
          {t("kicker")}
        </span>
        <h1 className="mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
          {t("heading")}
        </h1>
        <p className="mt-5 max-w-md text-balance text-base text-muted">{t("subheading")}</p>
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 py-12 md:grid-cols-2 md:px-10">
        <EnquiryForm />

        <div className="flex flex-col justify-between rounded-sm bg-champagne p-8">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-taupe-dark">
              {t("chatCard.kicker")}
            </span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
              {t("chatCard.heading")}
            </h2>
            <p className="mt-3 text-sm text-foreground/70">{t("chatCard.body")}</p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-taupe-dark px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
            >
              {t("chatCard.button")}
            </a>
          </div>

          <div className="mt-10 border-t border-foreground/10 pt-6 text-sm text-foreground/70">
            <span className="block text-xs font-medium uppercase tracking-[0.15em] text-taupe-dark">
              {t("chatCard.openingHours")}
            </span>
            <p className="mt-2">{t("chatCard.hoursLine")}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-2 md:px-10">
        {LOCATIONS.map((loc) => (
          <div key={loc.name} className="rounded-sm border border-border p-8">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-taupe-dark" />
              <div>
                <h3 className="text-lg font-medium tracking-tight text-foreground">{loc.name}</h3>
                <p className="mt-1 text-sm text-muted">{loc.address}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={loc.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-foreground/20 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                {t("branches.whatsappBranch")}
              </a>
              {loc.directionsHref && (
                <a
                  href={loc.directionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-foreground/20 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  {t("branches.getDirections")}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <FooterTranslated />
    </main>
  );
}
