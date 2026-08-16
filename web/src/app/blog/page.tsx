import type { Metadata } from "next";
import { POSTS } from "@/data/blog";
import BlogGrid from "@/components/BlogGrid";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "The d'reena Journal — d'reena beauty",
  description:
    "Notes from our therapists on the ingredients and treatments behind every facial — what they do, how they work, and why we choose them for your skin.",
};

export default function BlogPage() {
  return (
    <main>
      <div className="px-6 pb-8 pt-40 md:px-10 md:pt-48">
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
          The d&apos;reena Journal
        </span>
        <h1 className="mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
          Skin science, treatments, and what actually works.
        </h1>
        <p className="mt-5 max-w-[60ch] text-balance text-base text-muted">
          Notes from our therapists on the ingredients and treatments behind every facial — what
          they do, how they work, and why we choose them for your skin.
        </p>
      </div>

      <BlogGrid posts={POSTS} />

      <Footer />
    </main>
  );
}
