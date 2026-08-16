// Real Dermalogica page content, ported from the live site's
// Dermalogica.dc.html — same copy, same three "New In" products (real
// Dermalogica launches, claims verified against dermalogica-new-products.md
// on the live site), same six professional ranges.

export interface NewProduct {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export const NEW_PRODUCTS: NewProduct[] = [
  {
    slug: "futurecode-booster",
    name: "FutureCode Booster",
    tagline: "Damage correction + longevity serum",
    description:
      "Inspired by biohacking principles — supports skin's longevity by enhancing natural repair and helping reduce visible signs of DNA-related damage: deepening lines, coarse texture and discolouration.",
    image: "/images/futurecode-booster.jpg",
  },
  {
    slug: "neurotouch",
    name: "NeuroTouch Symmetry Serum",
    tagline: "Neuroscience-powered sculpting oil",
    description:
      "Facial sculpting skincare elevated by neuroscience — clinically shown to visibly restore facial symmetry for more sculpted-looking skin over an 8-week course.",
    image: "/images/neurotouch.jpg",
  },
  {
    slug: "water-cream",
    name: "Pro-Collagen Banking Water Cream",
    tagline: "Plumping + preserving hydrator",
    description:
      "Clinically proven to boost collagen by 44% and elastin by 56%, with visibly reduced fine lines and wrinkles in as little as 3 days.",
    image: "/images/water-cream.jpg",
  },
];

export interface Pillar {
  kicker: string;
  title: string;
  body: string;
}

export const PILLARS: Pillar[] = [
  {
    kicker: "Formulation",
    title: "No irritants, by design",
    body: "Free from artificial fragrance and colour, and the common irritants that quietly keep sensitive skin reactive.",
  },
  {
    kicker: "Education",
    title: "Therapist-led, always",
    body: "The professional range is only available through trained therapists — our team is certified and re-trained as formulas evolve.",
  },
  {
    kicker: "Results",
    title: "Prescribed to your skin",
    body: "Products are selected per skin, per visit — your treatment and your home routine work as one plan, not two.",
  },
];

export interface Range {
  name: string;
  body: string;
}

export const RANGES: Range[] = [
  {
    name: "Daily Skin Health",
    body: "The everyday core — cleansers, exfoliants, moisturisers and SPF that form the base of almost every routine we prescribe.",
  },
  {
    name: "Active Clearing",
    body: "For breakout-prone and congested skin, including adult acne that also shows early signs of ageing.",
  },
  {
    name: "PowerBright",
    body: "Targeted brightening for pigmentation, dark spots and uneven tone — the backbone of our brightening treatments.",
  },
  {
    name: "UltraCalming",
    body: "Barrier repair and relief for sensitive, reactive and redness-prone skin.",
  },
  {
    name: "AGE Smart & Retinol",
    body: "Firming, smoothing and collagen-supporting actives for skin showing lines, laxity and loss of density.",
  },
  {
    name: "Professional-only",
    body: "Treatment-room strength exfoliants, masques and boosters that are never sold for home use — the reason a professional facial outperforms a home routine.",
  },
];

export const FACE_MAPPING_STEPS = [
  "Zone-by-zone analysis of your skin's real condition.",
  "Treatment selected and adjusted on the day.",
  "A home routine prescribed to hold the result.",
];
