import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { photoFor, type Category, type TreatmentEntry } from "@/data/allTreatments";

export default function TreatmentCategorySection({
  category,
  treatments,
}: {
  category: Category;
  treatments: TreatmentEntry[];
}) {
  return (
    <section className="border-t border-border py-20 first:border-t-0 md:py-28">
      <div className="flex items-center justify-center gap-6">
        <span className="h-px w-12 bg-border-strong md:w-24" aria-hidden="true" />
        <h2 className="text-balance text-center text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark md:text-sm">
          {category}
        </h2>
        <span className="h-px w-12 bg-border-strong md:w-24" aria-hidden="true" />
      </div>

      <div className="mx-auto mt-12 grid max-w-[1600px] grid-cols-1 gap-8 px-6 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
        {treatments.map((t) => {
          const photo = photoFor(t);
          return (
            <div key={t.slug} className="flex flex-col">
              <Link href={`/treatments/${t.slug}`} className="group flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-background-secondary">
                  <Image
                    src={photo.src}
                    alt={t.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                <span className="mt-5 text-xs uppercase tracking-[0.12em] text-muted">{t.duration}</span>
                <h3 className="mt-2 text-xl font-medium tracking-tight text-foreground">{t.name}</h3>

                <ul className="mt-3 flex flex-col gap-1">
                  {t.benefits.slice(0, 3).map((b) => (
                    <li key={b} className="text-sm text-foreground/60">
                      {b}
                    </li>
                  ))}
                </ul>

                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-taupe-dark">
                  View Treatment
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>

              {photo.credit && photo.creditHref && (
                <a
                  href={photo.creditHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-fit text-[11px] text-muted/70 hover:text-muted"
                >
                  {photo.credit}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
