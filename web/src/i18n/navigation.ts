import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link/useRouter/usePathname — use these (instead of plain
// next/link) for navigation BETWEEN the four translated pages, so the
// current locale prefix is preserved. Links OUT to untranslated pages
// (Treatments, Dermalogica, Blog) should keep using plain next/link with a
// plain href — those pages have no locale prefix at all.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
