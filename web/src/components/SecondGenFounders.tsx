import Image from "next/image";

export default function SecondGenFounders() {
  return (
    <section className="border-t border-border bg-background px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,560px)] lg:items-center lg:gap-16">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-sm lg:order-2">
          <Image
            src="/images/shaun-elaine.jpg"
            alt="Shaun and Elaine, second-generation leaders at d'reena beauty"
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="lg:order-1">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
            The Next Generation
          </span>
          <h2 className="mt-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight text-foreground md:text-4xl">
            Shaun &amp; Elaine
          </h2>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">
            The second generation at d&apos;reena beauty — focused on educating every customer on
            what their skin actually needs, and continually reinventing our treatment menu with
            the latest, most advanced technology available.
          </p>
        </div>
      </div>
    </section>
  );
}
