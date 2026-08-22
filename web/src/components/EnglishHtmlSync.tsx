"use client";

import { useEffect } from "react";

// Mirrors LocaleHtmlSync for the (default) group: these pages are always
// English, so make sure the lang attribute is reset back to "en" after a
// client-side navigation away from a zh/ms page (which would otherwise
// leave document.documentElement.lang stuck on the previous locale, since
// client-side route transitions don't reload the document).
export default function EnglishHtmlSync() {
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);
  return null;
}
