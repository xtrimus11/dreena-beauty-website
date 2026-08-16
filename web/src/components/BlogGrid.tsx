"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/data/blog";

const PAGE_SIZE = 9;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BlogGrid({ posts }: { posts: Post[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-6 pb-8 pt-16 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
        {visible.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-background-secondary">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-taupe-dark">
                {post.kicker}
              </span>
              <span className="text-xs text-muted">{formatDate(post.date)}</span>
            </div>
            <h2 className="mt-2 text-xl font-medium leading-snug tracking-tight text-foreground">
              {post.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>

            <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-foreground">
              Read More
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </Link>
        ))}
      </div>

      <div className="flex justify-center pb-24">
        {hasMore && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full bg-taupe-dark px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
          >
            Next
          </button>
        )}
      </div>
    </>
  );
}
