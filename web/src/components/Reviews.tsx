"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star } from "lucide-react";
import { REVIEWS, GOOGLE_RATING, GOOGLE_REVIEW_COUNT, GOOGLE_MAPS_URL, type Review } from "@/data/reviews";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          strokeWidth={1.5}
          className={i < rating ? "fill-current" : "opacity-30"}
        />
      ))}
    </div>
  );
}

// A different cream / taupe / champagne shade per card, so the stack reads
// as a deliberate warm gradient rather than repeating the same flat block.
const CARD_SHADES = ["#f2e8d5", "#e9d9c1", "#dcc7a3", "#f5efe6", "#e3d2b4", "#efe3cc"];

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const filter = useTransform(scrollYProgress, [0, 1], ["brightness(1)", "brightness(0.65)"]);
  const shade = CARD_SHADES[index % CARD_SHADES.length];

  return (
    <div ref={ref} className="relative h-[115vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-4 py-6 md:px-10">
        <motion.div
          style={{ scale, filter, backgroundColor: shade }}
          className="relative flex h-full w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-sm px-8 text-center text-foreground md:px-24"
        >
          <StarRow rating={review.rating} />
          <p className="text-balance max-w-3xl text-2xl font-medium leading-[1.35] tracking-tight md:text-4xl">
            &ldquo;{review.quote}&rdquo;
          </p>
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.1em]">{review.name}</div>
            <div className="mt-1 text-xs text-foreground/55">
              {review.meta} · {review.timeAgo}
            </div>
          </div>
          <span className="absolute bottom-6 right-8 text-[10px] uppercase tracking-[0.2em] text-foreground/35 md:bottom-10 md:right-14">
            {String(index + 1).padStart(2, "0")} / {String(REVIEWS.length).padStart(2, "0")}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default function Reviews() {
  return (
    <section className="border-t border-border bg-background">
      <div className="flex flex-col gap-6 px-6 pt-28 md:flex-row md:items-end md:justify-between md:px-10 md:pt-40">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            Customer Reviews
          </span>
          <h2 className="mt-4 max-w-2xl text-balance text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
            What Seremban says about us.
          </h2>
        </div>
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 text-sm text-foreground/80 transition-colors hover:text-foreground"
        >
          <StarRow rating={Math.round(GOOGLE_RATING)} />
          <span>
            {GOOGLE_RATING} from {GOOGLE_REVIEW_COUNT} Google reviews
          </span>
        </a>
      </div>

      {REVIEWS.map((review, i) => (
        <ReviewCard key={review.name} review={review} index={i} />
      ))}
    </section>
  );
}
