import Navbar from "@/components/Navbar";
import EnglishHtmlSync from "@/components/EnglishHtmlSync";

// Wraps Treatments, Dermalogica, and Blog — pages that are staying
// English-only for now. Plain, non-locale-aware Navbar.
export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EnglishHtmlSync />
      <Navbar />
      {children}
    </>
  );
}
