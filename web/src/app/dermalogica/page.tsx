import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { NEW_PRODUCTS, PILLARS, RANGES, FACE_MAPPING_STEPS } from "@/data/dermalogica";
import Footer from "@/components/Footer";
import { WHATSAPP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dermalogica — d'reena beauty",
  description:
    "Exclusive Dermalogica distributor in Seremban — the professional skin care behind every treatment at d'reena beauty.",
};

export default function DermalogicaPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 px-6 pb-16 pt-40 md:grid-cols-[minmax(0,1fr)_420px] md:items-center md:gap-14 md:px-10 md:pt-48">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            Exclusive Dermalogica Distributor
          </span>
          <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.08] tracking-tight md:text-5xl">
            The professional skin care behind every treatment
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">
            Every facial at d&apos;reena is built on Dermalogica — the professional-grade skin
            health brand trusted by therapists worldwide. As an exclusive distributor, we carry
            the full professional range and the training that goes with it, so what touches your
            skin is prescribed, not guessed.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Exclusive distributor", "Certified therapists", "Professional-only formulas"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-foreground/70"
                >
                  {tag}
                </span>
              )
            )}
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
            New In
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            Just landed at d&apos;reena
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-muted">
            The newest additions to the professional range — ask your therapist to work these
            into your next treatment or home routine.
          </p>

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
                    New
                  </span>
                  <h3 className="mt-2 text-lg font-medium tracking-tight text-foreground">
                    {p.name}
                  </h3>
                  <span className="text-xs font-medium text-taupe-dark">{p.tagline}</span>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
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
            Why Dermalogica
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            Skin health, not cosmetics
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-muted">
            Dermalogica formulates for skin health rather than quick cosmetic effect — which is
            why it sits at the centre of a professional treatment menu rather than a retail
            shelf.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {PILLARS.map((pillar) => (
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
            The Professional Ranges
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-4xl">
            What we work with
          </h2>
          <p className="mt-4 max-w-[60ch] text-base text-muted">
            A short introduction rather than a catalogue — your therapist selects the exact
            products at consultation.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {RANGES.map((range) => (
              <div key={range.name} className="rounded-sm bg-background-secondary p-6">
                <h3 className="text-base font-medium tracking-tight text-foreground">
                  {range.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{range.body}</p>
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
              Face Mapping
            </span>
            <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight text-foreground md:text-4xl">
              Your skin, read zone by zone
            </h2>
            <p className="mt-4 max-w-[48ch] text-base text-foreground/70">
              Every treatment starts with a Dermalogica Face Mapping analysis — your therapist
              reads your face zone by zone to see what&apos;s actually happening, then builds the
              treatment around it.
            </p>
            <Link
              href="/skin-analysis"
              className="mt-8 inline-block rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
            >
              Start with the Skin Analysis
            </Link>
          </div>

          <div className="flex flex-col gap-5">
            {FACE_MAPPING_STEPS.map((step, i) => (
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
              Shop the range in-house
            </h3>
            <p className="mt-2 max-w-[46ch] text-sm text-muted">
              As an exclusive distributor we stock the professional range at our Seremban centre.
              Message us for availability, or ask your therapist to prescribe at your next visit.
            </p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
          >
            Ask About Products
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
