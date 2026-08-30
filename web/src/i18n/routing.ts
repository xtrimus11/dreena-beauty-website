import { defineRouting } from "next-intl/routing";

// Only Home, Skin Analysis, About, and Contact are multilingual. Treatments,
// Dermalogica, Blog, and individual treatment pages stay English-only at
// their existing plain URLs — this routing config only ever governs the
// four in-scope paths (see middleware.ts's matcher).
export const routing = defineRouting({
  locales: ["en", "zh", "ms"],
  defaultLocale: "en",
  // English stays unprefixed ("/", "/about", ...); Mandarin and Bahasa
  // Malaysia get "/zh" and "/ms" prefixes.
  localePrefix: "as-needed",
  // Without this, next-intl auto-redirects unprefixed paths based on the
  // browser's Accept-Language header or a stored NEXT_LOCALE cookie — so a
  // visitor with Malay/Chinese as a browser preference (or who once used
  // the language switcher) would get silently bounced from "/treatments"
  // to "/ms/treatments" even though they asked for the plain English URL.
  // English must stay the reliable default; zh/ms are opt-in only, via the
  // language switcher.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
