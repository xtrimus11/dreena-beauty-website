"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import { POSTS } from "@/data/blog";

const FEATURED = POSTS.slice(0, 6);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Insights() {
  const t = useTranslations("home.insights");
  const [hovered, setHovered] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    gsap.to(imageRef.current, {
      x: e.clientX - 400,
      y: e.clientY,
      duration: 0.6,
      ease: "power3.out",
    });
  };

  const active = FEATURED.find((p) => p.slug === hovered) ?? null;

  // Scale/opacity are driven by GSAP too (not a React style prop) — GSAP owns
  // the whole transform (x, y, scale) for this node, so a re-render from
  // hover state changes never stomps the x/y position it's mid-tweening.
  useEffect(() => {
    if (!imageRef.current) return;
    gsap.to(imageRef.current, {
      opacity: active ? 1 : 0,
      scale: active ? 1 : 0.85,
      duration: 0.35,
      ease: "power3.out",
    });
  }, [active]);

  return (
    <section className="border-t border-border bg-background px-6 py-28 md:px-10 md:py-40">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {t("kicker")}
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
            {t("heading")}
          </h2>
        </div>
        <Link
          href="/blog"
          className="group flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-taupe-dark"
        >
          {t("viewAll")}
          <ArrowUpRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      <div
        ref={listRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        className="mt-16 flex flex-col border-t border-border"
      >
        {FEATURED.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            onMouseEnter={() => setHovered(post.slug)}
            className="group grid grid-cols-[1fr_auto] items-center gap-6 border-b border-border py-6 md:grid-cols-[140px_1fr_140px_auto]"
          >
            <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-muted md:block">
              {post.kicker}
            </span>
            <span className="text-xl font-medium tracking-tight text-foreground transition-colors duration-300 group-hover:text-muted md:text-2xl">
              {post.title}
            </span>
            <span className="hidden text-xs text-muted md:block">{formatDate(post.date)}</span>
            <ArrowUpRight
              size={20}
              className="justify-self-end text-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </Link>
        ))}
      </div>

      <div
        ref={imageRef}
        className="pointer-events-none fixed left-0 top-0 z-50 h-56 w-80 overflow-hidden rounded-sm opacity-0 shadow-2xl"
      >
        {active && (
          <Image src={active.image} alt={active.title} fill sizes="320px" className="object-cover" />
        )}
      </div>
    </section>
  );
}
