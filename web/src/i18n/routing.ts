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
});

export type Locale = (typeof routing.locales)[number];
