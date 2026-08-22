import type { MetadataRoute } from "next";
import { POSTS } from "@/data/blog";
import { ALL_DETAILS } from "@/data/treatmentDetail";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/treatments`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/skin-analysis`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/dermalogica`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // The four multilingual pages, in Mandarin and Bahasa Malaysia.
  const localizedPaths = ["/", "/skin-analysis", "/about", "/contact"];
  const localizedRoutes: MetadataRoute.Sitemap = ["zh", "ms"].flatMap((locale) =>
    localizedPaths.map((path) => ({
      url: `${SITE_URL}/${locale}${path === "/" ? "" : path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 0.9 : 0.7,
    }))
  );

  const blogRoutes: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const treatmentRoutes: MetadataRoute.Sitemap = ALL_DETAILS.map((t) => ({
    url: `${SITE_URL}/treatments/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...localizedRoutes, ...blogRoutes, ...treatmentRoutes];
}
