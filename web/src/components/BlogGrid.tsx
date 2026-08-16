"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/data/blog";

const PAGE_SIZE = 9;

function PhotoCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-sm sm:aspect-[3/4]"
    >
      <Image
        src={post.image}
        alt={post.title}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/25 to-transparent" />
      <div className="relative mt-auto flex flex-col gap-2 p-6 text-cream">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-cream/80">
          {post.kicker}
        </span>
        <h2 className="text-xl font-medium leading-snug tracking-tight">{post.title}</h2>
        <span className="mt-2 inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em]">
          Read More
          <ArrowUpRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

function CreamCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex aspect-[4/5] flex-col rounded-sm bg-background-secondary p-6 sm:aspect-[3/4]"
    >
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-taupe-dark">
        {post.kicker}
      </span>
      <h2 className="mt-2 text-xl font-medium leading-snug tracking-tight text-foreground">
        {post.title}
      </h2>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
      <span className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-foreground">
        Read More
        <ArrowUpRight
          size={14}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </Link>
  );
}

export default function BlogGrid({ posts }: { posts: Post[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 px-6 pb-8 pt-16 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
        {visible.map((post) =>
          post.cardStyle === "photo" ? (
            <PhotoCard key={post.slug} post={post} />
          ) : (
            <CreamCard key={post.slug} post={post} />
          )
        )}
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
