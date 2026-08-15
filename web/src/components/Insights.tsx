"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import { POSTS } from "@/data/blog";
import { LIVE_LINKS } from "@/lib/site";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Insights() {
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

  const active = POSTS.find((p) => p.slug === hovered) ?? null;

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
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">Insights</span>
      <h2 className="mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
        The <span className="uppercase">d&apos;reena</span> Journal
      </h2>

      <div
        ref={listRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        className="mt-16 flex flex-col border-t border-border"
      >
        {POSTS.map((post) => (
          <a
            key={post.slug}
            href={LIVE_LINKS.blogPost(post.slug)}
            target="_blank"
            rel="noopener noreferrer"
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
          </a>
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
