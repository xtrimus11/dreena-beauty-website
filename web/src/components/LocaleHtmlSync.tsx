"use client";

import { useEffect } from "react";

// The root <html lang="en"> can't be set dynamically per-locale from a
// nested layout (the <html> tag itself lives in the true root layout,
// which is shared with the untranslated pages too). This is a small,
// standard workaround: correct it client-side once the locale is known.
export default function LocaleHtmlSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
