import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// No private/gated content on this site, so every crawler — including the
// AI assistants people now use as answer engines (Google-Extended,
// ClaudeBot, PerplexityBot, GPTBot, OAI-SearchBot, etc.) — is allowed in
// by the wildcard rule below.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
