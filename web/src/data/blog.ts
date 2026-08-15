// Mirrors the 6 most recent posts in blog-data.js on the live site — same
// slugs, titles, dates, images and credits, so this list stays truthful to
// what's actually published. Full posts still live on the static site; each
// row links out via LIVE_LINKS.blogPost(slug).
export interface Post {
  slug: string;
  title: string;
  kicker: string;
  date: string;
  image: string;
  imageCredit: string | null;
}

export const POSTS: Post[] = [
  {
    slug: "what-is-biohacking-for-skin",
    title: "What “Biohacking” Actually Means for Your Skin",
    kicker: "Ingredients",
    date: "2026-08-13",
    image: "/images/futurecode-booster.jpg",
    imageCredit: null,
  },
  {
    slug: "acne-scarring-treatments",
    title: "5 Ways We Treat Acne Scarring",
    kicker: "Treatments Explained",
    date: "2026-08-12",
    image:
      "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?q=80&w=1200&auto=format&fit=crop",
    imageCredit: "Photo by kimia kazemi on Unsplash",
  },
  {
    slug: "vitamin-c-benefits",
    title: "The Real Benefits of Vitamin C (And Why We Layer It Carefully)",
    kicker: "Ingredients",
    date: "2026-08-05",
    image:
      "https://images.unsplash.com/photo-1760862652442-e8ff7ebdd2f8?q=80&w=1200&auto=format&fit=crop",
    imageCredit: "Photo by Ela De Pure on Unsplash",
  },
  {
    slug: "pico-laser-pigmentation",
    title: "Pico Laser and Pigmentation: What's Really Happening Under Your Skin",
    kicker: "Treatments Explained",
    date: "2026-07-29",
    image:
      "https://images.unsplash.com/photo-1555820585-c5ae44394b79?q=80&w=1200&auto=format&fit=crop",
    imageCredit: "Photo by Sunny Ng on Unsplash",
  },
  {
    slug: "how-hifu-tightens-skin",
    title: "How HIFU Actually Tightens Your Skin",
    kicker: "Treatments Explained",
    date: "2026-07-22",
    image: "/images/hifu-clinic.jpg",
    imageCredit: null,
  },
  {
    slug: "skin-barrier-ingredients",
    title: "3 Ingredients Your Skin Barrier Actually Loves",
    kicker: "Ingredients",
    date: "2026-07-15",
    image:
      "https://images.unsplash.com/photo-1603401712778-ab0575182f12?q=80&w=1200&auto=format&fit=crop",
    imageCredit: "Photo by xandro Vandewalle on Unsplash",
  },
];
