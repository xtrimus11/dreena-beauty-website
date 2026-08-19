import type { Metadata, Viewport } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import GrainOverlay from "@/components/GrainOverlay";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "d'reena beauty — Real Skin Care. Real Results.",
    template: "%s — d'reena beauty",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Seremban beauty centre",
    "Dermalogica facial Seremban",
    "skin treatment Negeri Sembilan",
    "facial Seremban 2",
    "facial Senawang",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: "d'reena beauty — Real Skin Care. Real Results.",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
    locale: "en_MY",
  },
  twitter: {
    card: "summary_large_image",
    title: "d'reena beauty — Real Skin Care. Real Results.",
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f1e7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={organizationJsonLd()} />
      </head>
      <body className="antialiased">
        <GrainOverlay />
        <SmoothScroll>
          <Navbar />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
