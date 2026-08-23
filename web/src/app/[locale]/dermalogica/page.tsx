import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { NEW_PRODUCTS, RANGES } from "@/data/dermalogica";
import FooterTranslated from "@/components/FooterTranslated";
import JsonLd from "@/components/JsonLd";
import { Link } from "@/i18n/navigation";
import { WHATSAPP_URL } from "@/lib/site";
import { breadcrumbJsonLd, localizedAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dermalogicaPage.meta" });
  const alternates = localizedAlternates("/dermalogica", locale);
  return {
    title: t("title"),
    description: t("description"),
    alternates,
    openGraph: { title: t("title"), description: t("description"), url: alternates.canonical },
    twitter: { title: t("title"), description: t("description") },
  };
}

export default async function DermalogicaPage() {
  const t = await getTranslations("dermalogicaPage");
  const pillars = t.raw("pillars") as { kicker: string; title: string; body: string }[];
  const faceMappingSteps = t.raw("faceMapping.steps") as string[];

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Dermalogica", path: "/dermalogica" }])}
      />
      {/* Hero */}
      <section className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-6 pb-16 pt-40 md:grid-cols-[minmax(0,1fr)_420px] md:items-center md:gap-14 md:px-10 md:pt-48">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {t("hero.kicker")}
          </span>
          <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.08] tracking-tight md:text-5xl">
            {t("hero.heading")}
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">{t("hero.body")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[t("hero.tag1"), t("hero.tag2"), t("hero.tag3")].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
          <Image
            src="/images/futurecode-hero.jpg"
            alt="FutureCode Booster biohacking protocol dosage guide"
            fill
            sizes="(min-width: 768px) 420px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* New In */}
      <section className="border-t border-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1600px]">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {t("newIn.kicker")}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            {t("newIn.heading")}
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-muted">{t("newIn.body")}</p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {NEW_PRODUCTS.map((p) => (
              <div key={p.slug} className="flex flex-col overflow-hidden rounded-sm bg-background-secondary">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-6">
                  <span className="w-fit rounded-full bg-taupe-dark px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-cream">
                    {t("newIn.newBadge")}
                  </span>
                  <h3 className="mt-2 text-lg font-medium tracking-tight text-foreground">
                    {p.name}
                  </h3>
                  <span className="text-xs font-medium text-taupe-dark">
                    {t(`products.${p.slug}.tagline`)}
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t(`products.${p.slug}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Dermalogica */}
      <section className="border-t border-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1600px]">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {t("why.kicker")}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            {t("why.heading")}
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-muted">{t("why.body")}</p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="flex flex-col gap-2 border-t border-border pt-6">
                <span className="text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark">
                  {pillar.kicker}
                </span>
                <h3 className="text-lg font-medium tracking-tight text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional ranges */}
      <section className="border-t border-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1600px]">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {t("ranges.kicker")}
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            {t("ranges.heading")}
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-muted">{t("ranges.body")}</p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RANGES.map((range) => (
              <div key={range.name} className="rounded-sm bg-background-secondary p-6">
                <h3 className="text-base font-medium tracking-tight text-foreground">
                  {range.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`rangeItems.${range.name}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Face Mapping */}
      <section className="border-t border-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 rounded-sm bg-champagne p-8 md:grid-cols-[minmax(0,1fr)_360px] md:items-center md:p-14">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
              {t("faceMapping.kicker")}
            </span>
            <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight text-foreground md:text-4xl">
              {t("faceMapping.heading")}
            </h2>
            <p className="mt-4 max-w-[48ch] text-base text-foreground/70">
              {t("faceMapping.body")}
            </p>
            <Link
              href="/skin-analysis"
              className="mt-8 inline-block rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
            >
              {t("faceMapping.cta")}
            </Link>
          </div>

          <div className="flex flex-col gap-5">
            {faceMappingSteps.map((step, i) => (
              <div key={step} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-taupe-dark text-sm font-medium text-cream">
                  {i + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed text-foreground/80">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop the range */}
      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-6 rounded-sm border border-border p-8 md:flex-row md:items-center md:p-12">
          <div>
            <h3 className="text-xl font-medium tracking-tight text-foreground">
              {t("shop.heading")}
            </h3>
            <p className="mt-2 max-w-[46ch] text-sm text-muted">{t("shop.body")}</p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
          >
            {t("shop.cta")}
          </a>
        </div>
      </section>

      <FooterTranslated />
    </main>
  );
}
