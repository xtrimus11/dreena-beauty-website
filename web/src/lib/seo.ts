// Shared SEO constants and JSON-LD builders. Kept in one place so every
// page's structured data agrees with itself (same site name, same URL,
// same logo) instead of drifting apart over time.
import { GOOGLE_MAPS_URL, GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from "@/data/reviews";

export const SITE_URL = "https://dreena-beauty-website.vercel.app";
export const SITE_NAME = "d'reena beauty";
export const DEFAULT_DESCRIPTION =
  "Seremban's beauty centre since 1987. Dermalogica-certified facials and skin treatments, personalised to your skin's true condition.";
export const DEFAULT_OG_IMAGE = {
  url: "/images/dreena-mark.png",
  width: 1633,
  height: 799,
  alt: "d'reena beauty",
};

/** Brand-level Organization — sitewide, rendered once in the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/dreena-mark.png`,
    sameAs: [GOOGLE_MAPS_URL],
    description: DEFAULT_DESCRIPTION,
  };
}

/**
 * The two physical branches, as real LocalBusiness entities. Only the
 * Seremban 2 branch carries the aggregateRating — that's the listing
 * GOOGLE_RATING/GOOGLE_REVIEW_COUNT was actually pulled from (see
 * data/reviews.ts). Rendered on the Contact page, where this exact
 * information is shown to visitors.
 */
export function localBusinessesJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      "@id": `${SITE_URL}/contact#seremban-2`,
      name: "d'reena beauty centre",
      url: `${SITE_URL}/contact`,
      image: `${SITE_URL}/images/founder.jpg`,
      telephone: "+60122192247",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Uptown Avenue",
        addressLocality: "Seremban 2",
        addressRegion: "Negeri Sembilan",
        addressCountry: "MY",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "19:00",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: GOOGLE_RATING,
        reviewCount: GOOGLE_REVIEW_COUNT,
      },
      sameAs: [GOOGLE_MAPS_URL],
    },
    {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      "@id": `${SITE_URL}/contact#senawang`,
      name: "d'sensations beauty",
      url: `${SITE_URL}/contact`,
      telephone: "+60189188664",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Taipan 2",
        addressLocality: "Senawang",
        addressRegion: "Negeri Sembilan",
        addressCountry: "MY",
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "19:00",
      },
    },
  ];
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function blogPostingJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [post.image],
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/dreena-mark.png`,
      },
    },
  };
}

/** Real, non-priced Service entries for the Treatments page — matches
 *  exactly what's shown to visitors there, nothing added. */
export function servicesJsonLd(treatments: { name: string; summary: string; category: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: treatments.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: t.name,
        description: t.summary,
        category: t.category,
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
        },
        areaServed: "Seremban, Negeri Sembilan",
      },
    })),
  };
}
