import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;

// Scoped to ONLY the six translated paths (and their /zh, /ms variants).
// Note "/treatments" (the listing page) is here but "/treatments/[slug]"
// deliberately isn't — individual treatment pages stay English-only, so
// they're excluded and fall through to the (default) group untouched.
// Blog, robots.txt, sitemap.xml, llms.txt, static assets are likewise
// never touched by this middleware.
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
    "/treatments",
    "/(zh|ms)/treatments",
    "/dermalogica",
    "/(zh|ms)/dermalogica",
  ],
};
