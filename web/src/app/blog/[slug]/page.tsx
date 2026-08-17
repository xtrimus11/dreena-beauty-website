import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, getPost, otherPosts } from "@/data/blog";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — d'reena beauty`,
    description: post.excerpt,
  };
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = otherPosts(post.slug, 3);

  return (
    <main>
      <div className="mx-auto max-w-[760px] px-6 pt-32 md:px-10 md:pt-40">
        <Link href="/blog" className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          ← Back to the Journal
        </Link>

        <div className="mt-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-taupe-dark">
            {post.kicker}
          </span>
          <h1 className="mt-3 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-muted">{formatDate(post.date)}</p>
        </div>

        <div className="relative mt-9 aspect-[16/9] w-full overflow-hidden rounded-sm">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="760px"
            className="object-cover"
            priority
          />
        </div>
        {post.imageCredit && post.imageCreditHref && (
          <a
            href={post.imageCreditHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-xs text-muted/70 hover:text-muted"
          >
            {post.imageCredit}
          </a>
        )}

        <div className="mt-10 flex flex-col gap-6">
          {post.body.map((para, i) => (
            <p key={i} className="text-base leading-[1.75] text-foreground/85">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-sm bg-champagne p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-medium tracking-tight text-foreground">
              Not sure this is right for your skin?
            </h3>
            <p className="mt-2 max-w-[42ch] text-sm text-foreground/70">
              Take our 2-minute Skin Analysis for a personalised recommendation before you book.
            </p>
          </div>
          <Link
            href="/skin-analysis"
            className="shrink-0 rounded-full bg-taupe-dark px-6 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-opacity hover:opacity-90"
          >
            Take the Skin Analysis
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-16 md:px-10">
          <h2 className="text-xl font-medium tracking-tight text-foreground">
            More from the Journal
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="group flex flex-col gap-2">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-background-secondary">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <span className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-taupe-dark">
                  {item.kicker}
                </span>
                <span className="text-sm font-medium leading-snug tracking-tight text-foreground">
                  {item.title}
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
