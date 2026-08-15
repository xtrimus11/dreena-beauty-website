// Full d'reena Treatment Programs 2026 menu — ported faithfully from the
// live site's treatments-data.js (same slugs, names, durations, summaries
// and benefits; prices intentionally omitted — this page doesn't show
// pricing). Category photos are the same credited Unsplash photos already
// in use on the live site; a few treatments that already have a more
// specific photo elsewhere in this app (ACR, HIFU, Pico Laser) use that
// instead of the shared category photo, for a bit more visual variety.
export const CATEGORIES = [
  "All Skin Types",
  "Acne-Prone Skin",
  "Aging Skin",
  "Sensitive Skin",
  "Pigmentation & Uneven Tone",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface TreatmentEntry {
  slug: string;
  name: string;
  category: Category;
  duration: string;
  summary: string;
  benefits: string[];
}

export const TREATMENTS: TreatmentEntry[] = [
  {
    slug: "teenskin",
    name: "TeenSkin Treatment",
    category: "All Skin Types",
    duration: "45 min",
    summary: "A gentle teen skin analysis and 5-step treatment built for breakout-prone young skin.",
    benefits: ["Make-up removal + double cleanse", "Exfoliation with hot/cold steam", "High frequency & cold hammer finish"],
  },
  {
    slug: "skin-boost",
    name: "SkinBoost Treatment",
    category: "All Skin Types",
    duration: "90 min",
    summary: "A customisable boost — soothing, purifying or hydrating — for whatever your skin needs today.",
    benefits: ["Choose Soothing, Purifying or Hydrating", "Great for weather or pollution stress", "Calms and refreshes on the spot"],
  },
  {
    slug: "multivitamin-restore-rf",
    name: "Multivitamin Restore with RF",
    category: "All Skin Types",
    duration: "90–120 min",
    summary: "Dermalogica Multivitamin Power Exfoliant plus RF firming technology for fresher, healthier skin.",
    benefits: ["Maximum-strength exfoliation", "RF technology boosts penetration", "5x concentrated vitamin masque"],
  },
  {
    slug: "revive-glow",
    name: "Revive Glow Treatment",
    category: "All Skin Types",
    duration: "75 min",
    summary: "A Glycolic and Mandelic Acid VITAL Peeling facial for gentle exfoliation and re-textured glow.",
    benefits: ["Superficial-depth peel", "Re-textures and smooths", "Boosts skin's natural glow"],
  },
  {
    slug: "bio-cell",
    name: "Bio Cell Treatment",
    category: "All Skin Types",
    duration: "90 min",
    summary: "Micro-resurfacing with freshwater sponge to exfoliate, draw out impurities and rejuvenate.",
    benefits: ["Improves fine lines & scars", "Evens out skin tone", "Non-drying, high safety profile"],
  },

  {
    slug: "clear-matt",
    name: "Clear-Matt Treatment",
    category: "Acne-Prone Skin",
    duration: "60 min",
    summary: "A soft peel and dermal layering treatment that controls oil and rejuvenates dull, oily skin.",
    benefits: ["Controls sebum production", "GlowFix solution + extraction", "Great for stage-1 acne"],
  },
  {
    slug: "pico-plus",
    name: "Pico Plus - Laser & Light Treatment",
    category: "Acne-Prone Skin",
    duration: "30–50 min",
    summary: "Laser + OPT combination that addresses acne, scarring and pigmentation with no downtime.",
    benefits: ["Reduced pore size & fine lines", "Stimulates collagen growth", "Add Caviar ampoule + masque"],
  },
  {
    slug: "acr-treatment",
    name: "ACR Treatment",
    category: "Acne-Prone Skin",
    duration: "90 min",
    summary: "Absolute Cell Reversal — accelerates skin metabolism to promote cell repair and renewal.",
    benefits: ["Reduces acne & acne scars", "Controls sebum production", "Firming & lifting effect"],
  },
  {
    slug: "proclear",
    name: "ProClear Skin Treatment",
    category: "Acne-Prone Skin",
    duration: "90 min",
    summary: "Pore softening, extractions and anti-bacterial actives built for adult acne and congestion.",
    benefits: ["Deep pore softening & extraction", "Calms redness and inflammation", "Improves texture and hydration"],
  },

  {
    slug: "caviar-restore",
    name: "Caviar Restore Treatment",
    category: "Aging Skin",
    duration: "90 min",
    summary: "Caviar Essence Serum with ultrasound to rejuvenate, renew and repair mature skin.",
    benefits: ["Intensive firming effect", "Deep nourishment for mature skin", "Visibly smoother, denser feel"],
  },
  {
    slug: "glo2-facial",
    name: "Glo2 Facial Treatment",
    category: "Aging Skin",
    duration: "120 min",
    summary: "A breakthrough hydrating oxygen treatment for skin resurfacing and a renewed youthful glow.",
    benefits: ["Skin plumping and hydrating", "Increased collagen", "Reduced appearance of wrinkles"],
  },
  {
    slug: "ionto-stem-cell",
    name: "IONTO Stem Cell Treatment",
    category: "Aging Skin",
    duration: "120 min",
    summary: "Iontophoresis infuses potent stem cell extracts deep into skin to brighten, tighten and repair.",
    benefits: ["Stimulates collagen & elastin", "Brightens and evens skin tone", "Deeply hydrates and smooths"],
  },
  {
    slug: "hifu",
    name: "HIFU - Ultratherapy",
    category: "Aging Skin",
    duration: "60–90 min",
    summary: "High Intensity Focused Ultrasound lifts and tightens face, neck and eyes with no surgery.",
    benefits: ["Lifts and tightens visibly", "Stimulates deep collagen production", "No downtime, no surgery"],
  },
  {
    slug: "lumilift-elite",
    name: "LumiLift Elite",
    category: "Aging Skin",
    duration: "120 min",
    summary: "HIFU + Ionto delivery with caviar peptides and medical-grade retinol for instant luminosity.",
    benefits: ["Structural rejuvenation", "Instant luminosity boost", "Long-term lifting results"],
  },
  {
    slug: "pro-lumin-fusion",
    name: "PRO Lumin Fusion",
    category: "Aging Skin",
    duration: "120 min",
    summary: "Nanoinfusion with Dermalogica Pro Pen, exfoliation stacking and LED light therapy.",
    benefits: ["Improves skin luminosity", "Smooths fine lines and wrinkles", "Instantly reveals radiant skin"],
  },

  {
    slug: "environmental",
    name: "Environmental Treatment",
    category: "Sensitive Skin",
    duration: "120 min",
    summary: "A protective, barrier-repair facial that shields skin from pollution and daily stressors.",
    benefits: ["Strengthens the skin barrier", "Soothes eczema-prone skin", "Calms reactive skin"],
  },
  {
    slug: "oxygen",
    name: "Oxygen Treatment",
    category: "Sensitive Skin",
    duration: "120 min",
    summary: "An intense hydration boost that improves uneven tone and elasticity, refreshing on contact.",
    benefits: ["Instant radiance boost", "Deeply hydrating", "Improves elasticity"],
  },
  {
    slug: "pro-calm",
    name: "PRO Calm Treatment",
    category: "Sensitive Skin",
    duration: "120 min",
    summary: "Targeted hydration and barrier repair to soothe rosacea, eczema and visible redness.",
    benefits: ["Reduces redness and reactivity", "Soothes rosacea, eczema and psoriasis", "Rebalances sensitive skin"],
  },

  {
    slug: "whiteglow",
    name: "WhiteGlow Treatment",
    category: "Pigmentation & Uneven Tone",
    duration: "120 min",
    summary: "PowerBright IonActive and BioLumin-C Pro serums with ultrasonic infusion for instant brightening.",
    benefits: ["Instant skin lightening", "Brightening without dryness", "Luminous, glowing complexion"],
  },
  {
    slug: "probright",
    name: "ProBright Skin Treatment with ProRestore",
    category: "Pigmentation & Uneven Tone",
    duration: "60 min",
    summary: "Electrical infusion of Vitamin C, Niacinamide and Hexylresorcinol to fade dark spots.",
    benefits: ["Reduced dark spots", "Brighter, more even skin tone", "Restores skin barrier with ProRestore"],
  },
  {
    slug: "hollywood-peel",
    name: "Hollywood Peel Treatment",
    category: "Pigmentation & Uneven Tone",
    duration: "120 min",
    summary: "Brightens and tightens for a natural, well-rested look while reducing acne and sebum.",
    benefits: ["Improves tone, texture & elasticity", "Shrinks pores", "Reduces redness from acne"],
  },
  {
    slug: "pico-laser",
    name: "Pico Laser with ProRestore",
    category: "Pigmentation & Uneven Tone",
    duration: "45 min",
    summary: "SnowLight Pico Laser lightens pigmentation and chloasma while firming and shrinking pores.",
    benefits: ["Lightens pigmentation & chloasma", "Improves acne scars", "Firms and lifts skin"],
  },
  {
    slug: "skin360",
    name: "Skin360 Photo Treatment",
    category: "Pigmentation & Uneven Tone",
    duration: "120 min",
    summary: "High-intensity pulsed light improves tone, texture and superficial sun damage.",
    benefits: ["Reduces age & sun spots", "Reduces acne and acne scars", "Minimal downtime"],
  },
];

interface Photo {
  src: string;
  credit: string | null;
  creditHref: string | null;
}

// One shared photo per category (same credited Unsplash photos as the live
// site's CATEGORY_PHOTOS), used by every treatment in that category unless
// overridden below.
export const CATEGORY_PHOTOS: Record<Category, Photo> = {
  "All Skin Types": {
    src: "https://images.unsplash.com/photo-1647004692483-c5d942fe1137?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by Soheil Kmp on Unsplash",
    creditHref: "https://unsplash.com/@soheilkmp",
  },
  "Acne-Prone Skin": {
    src: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by kimia kazemi on Unsplash",
    creditHref: "https://unsplash.com/@kimick",
  },
  "Aging Skin": {
    src: "https://images.unsplash.com/photo-1713085085470-fba013d67e65?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by Look Studio on Unsplash",
    creditHref: "https://unsplash.com/@lookphoto",
  },
  "Sensitive Skin": {
    src: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by engin akyurt on Unsplash",
    creditHref: "https://unsplash.com/@enginakyurt",
  },
  "Pigmentation & Uneven Tone": {
    src: "https://images.unsplash.com/photo-1555820585-c5ae44394b79?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by Sunny Ng on Unsplash",
    creditHref: "https://unsplash.com/@sunnysmng",
  },
};

// A few treatments already have a more specific photo elsewhere in this app
// — reuse those instead of the shared category photo.
const TREATMENT_PHOTO_OVERRIDES: Record<string, Photo> = {
  "acr-treatment": {
    src: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by kimia kazemi on Unsplash",
    creditHref: "https://unsplash.com/@kimick",
  },
  hifu: { src: "/images/hifu-clinic.jpg", credit: null, creditHref: null },
  "pico-laser": {
    src: "https://images.unsplash.com/photo-1713085085470-fba013d67e65?q=80&w=1200&auto=format&fit=crop",
    credit: "Photo by Look Studio on Unsplash",
    creditHref: "https://unsplash.com/@lookphoto",
  },
};

export function photoFor(t: TreatmentEntry): Photo {
  return TREATMENT_PHOTO_OVERRIDES[t.slug] ?? CATEGORY_PHOTOS[t.category];
}
