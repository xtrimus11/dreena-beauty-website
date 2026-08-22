import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_DETAILS, getTreatmentDetail, relatedTreatments } from "@/data/treatmentDetail";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { WHATSAPP_URL } from "@/lib/site";
import { breadcrumbJsonLd, treatmentServiceJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return ALL_DETAILS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const treatment = getTreatmentDetail(slug);
  if (!treatment) return {};
  return {
    title: treatment.name,
    description: treatment.summary,
    alternates: { canonical: `/treatments/${treatment.slug}` },
    openGraph: {
      title: treatment.name,
      description: treatment.summary,
      url: `/treatments/${treatment.slug}`,
      images: [{ url: treatment.photo }],
    },
    twitter: {
      title: treatment.name,
      description: treatment.summary,
      images: [treatment.photo],
    },
  };
}

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const treatment = getTreatmentDetail(slug);
  if (!treatment) notFound();

  const related = relatedTreatments(treatment.slug, 3);

  return (
    <main>
      <JsonLd
        data={[
          treatmentServiceJsonLd(treatment),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Treatments", path: "/treatments" },
            { name: treatment.name, path: `/treatments/${treatment.slug}` },
          ]),
        ]}
      />

      <div className="mx-auto max-w-[1600px] px-6 pt-32 md:px-10 md:pt-40">
        <Link href="/treatments" className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          ← All Treatments
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_460px] md:items-start md:gap-14">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
              {treatment.category}
            </span>
            <h1 className="mt-3 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              {treatment.name}
            </h1>

            <span className="mt-5 inline-block rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-foreground/70">
              {treatment.duration}
            </span>

            <p className="mt-6 max-w-[56ch] text-base leading-relaxed text-foreground/85">
              {treatment.summary}
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {treatment.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-taupe-dark"
                    aria-hidden="true"
                  />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-6">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
              >
                Book This Treatment
              </a>
              <Link
                href="/skin-analysis"
                className="inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                Not sure? Take the Skin Analysis
              </Link>
            </div>
          </div>

          <div>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-background-secondary">
              <Image
                src={treatment.photo}
                alt={treatment.name}
                fill
                sizes="(min-width: 768px) 460px, 100vw"
                className="object-cover"
                priority
              />
            </div>
            {treatment.photoCredit && treatment.photoCreditHref && (
              <a
                href={treatment.photoCreditHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-muted/70 hover:text-muted"
              >
                {treatment.photoCredit}
              </a>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-20 md:px-10">
          <h2 className="text-xl font-medium tracking-tight text-foreground">You may also like</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/treatments/${item.slug}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-background-secondary">
                  <Image
                    src={item.photo}
                    alt={item.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <span className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark">
                  {item.category}
                </span>
                <span className="text-sm font-medium leading-snug tracking-tight text-foreground">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
