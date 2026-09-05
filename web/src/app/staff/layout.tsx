import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diary — d'reena staff",
  // Never index the staff diary.
  robots: { index: false, follow: false },
};

// The staff diary opts out of the marketing chrome: SmoothScroll and
// GrainOverlay both check for /staff and stand down (see their components).
// Nothing else is needed here — the root layout supplies <html> and <body>.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#fbfaf7]">{children}</div>;
}
