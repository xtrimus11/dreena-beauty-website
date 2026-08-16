import Link from "next/link";
import { LIVE_LINKS, WHATSAPP_URL } from "@/lib/site";

const EXPLORE = [
  { label: "Treatments", href: "/treatments", internal: true },
  { label: "Skin Analysis", href: LIVE_LINKS.skinAnalysis, internal: false },
  { label: "About Us", href: "/about", internal: true },
  { label: "Dermalogica", href: "/dermalogica", internal: true },
  { label: "Blog", href: "/blog", internal: true },
];

const VISIT = [
  { label: "Uptown Avenue, Seremban 2", href: "/contact", internal: true },
  { label: "Taipan 2, Senawang", href: "/contact", internal: true },
  { label: "WhatsApp: +60 12-345 6789", href: WHATSAPP_URL, internal: false },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="text-sm font-medium uppercase tracking-[0.2em]">d&apos;reena</span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Your local beauty aesthetician group in Seremban, providing personalised facial and
            skincare treatments since 1987.
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Explore</span>
          <div className="mt-4 flex flex-col gap-3">
            {EXPLORE.map((l) =>
              l.internal ? (
                <Link
                  key={l.label}
                  href={l.href}
                  className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              )
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted">Visit</span>
          <div className="mt-4 flex flex-col gap-3">
            {VISIT.map((l) =>
              l.internal ? (
                <Link
                  key={l.label}
                  href={l.href}
                  className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[1600px] border-t border-border pt-6 text-xs text-muted">
        © 2026 d&apos;reena beauty. All rights reserved.
      </div>
    </footer>
  );
}
