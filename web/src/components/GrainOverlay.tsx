"use client";

import { usePathname } from "next/navigation";

export default function GrainOverlay() {
  const pathname = usePathname();
  // No decorative grain over the staff diary — it is a dense data screen.
  if (pathname?.startsWith("/staff")) return null;
  return <div className="grain-overlay" aria-hidden="true" />;
}
