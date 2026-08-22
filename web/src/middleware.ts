import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;

// Scoped to ONLY the four translated paths (and their /zh, /ms variants).
// Everything else — /treatments, /dermalogica, /blog, individual treatment
// pages, robots.txt, sitemap.xml, llms.txt, static assets — never touches
// this middleware at all, so they're completely unaffected.
export const config = {
  matcher: [
    "/",
    "/(zh|ms)",
    "/about",
    "/(zh|ms)/about",
    "/contact",
    "/(zh|ms)/contact",
    "/skin-analysis",
    "/(zh|ms)/skin-analysis",
  ],
};
