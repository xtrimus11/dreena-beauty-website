import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateStaffSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

// Next runs exactly one middleware file, so the public site's i18n and the
// staff diary's auth gate are dispatched from here by path. They never
// overlap: /staff is not a translated route and must not be rewritten by
// next-intl.
export default function middleware(request: NextRequest): Promise<NextResponse> | NextResponse {
  if (request.nextUrl.pathname.startsWith("/staff")) {
    return updateStaffSession(request);
  }
  return intlMiddleware(request);
}

// Note "/treatments" (the listing page) is here but "/treatments/[slug]"
// deliberately isn't — individual treatment pages stay English-only, so
// they're excluded and fall through to the (default) group untouched.
// Blog, robots.txt, sitemap.xml, llms.txt, static assets are likewise
// never touched by the intl middleware.
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
    // The whole staff diary, for the auth gate.
    "/staff/:path*",
  ],
};
