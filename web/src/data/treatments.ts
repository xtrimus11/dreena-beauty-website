// Real d'reena Treatment Programs 2026 menu entries — one flagship per skin
// category, mirroring the "Best Sellers" grid on the live site. Photos are
// the same category photography already in use on dreena-beauty-website
// (Unsplash, credited), except HIFU which uses the clinic's own treatment
// room photo.
export interface Treatment {
  slug: string;
  category: string;
  name: string;
  /** Short line shown under the name in the expertise list — what it's for. */
  tagline: string;
  duration: string;
  summary: string;
  benefits: string[];
  photo: string;
  photoCredit: string | null;
  photoCreditHref: string | null;
}

export const TREATMENTS: Treatment[] = [
  {
    slug: "exosome-mts",
    category: "All Skin Types",
    name: "Exosome Treatment with MTS",
    tagline: "Next Generation Skin Treatment",
    duration: "120 min",
    summary:
      "Microneedling opens micro-channels for exosomes to penetrate deep into the skin, delivering growth factors that accelerate repair and collagen renewal.",
    benefits: [
      "Visibly firmer, brighter, more even-toned skin",
      "Reduces the look of fine lines",
      "Faster recovery than standalone facials",
    ],
    photo:
      "https://images.unsplash.com/photo-1761819920857-7edc5e808fd3?q=80&w=1400&auto=format&fit=crop",
    photoCredit: "Photo by Corinne Sawers on Unsplash",
    photoCreditHref: "https://unsplash.com/@corinneclionagroup",
  },
  {
    slug: "acr-treatment",
    category: "Acne-Prone Skin",
    name: "ACR Treatment",
    tagline: "For Acne Skin",
    duration: "90 min",
    summary:
      "Absolute Cell Reversal — accelerates skin metabolism to promote cell repair and renewal.",
    benefits: [
      "Reduces acne & acne scars",
      "Controls sebum production",
      "Firming & lifting effect",
    ],
    photo:
      "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?q=80&w=1400&auto=format&fit=crop",
    photoCredit: "Photo by kimia kazemi on Unsplash",
    photoCreditHref: "https://unsplash.com/@kimick",
  },
  {
    slug: "hifu",
    category: "Aging Skin",
    name: "HIFU",
    tagline: "Firms & Tightens",
    duration: "60–90 min",
    summary:
      "High Intensity Focused Ultrasound lifts and tightens face, neck and eyes with no surgery.",
    benefits: [
      "Lifts and tightens visibly",
      "Stimulates deep collagen production",
      "No downtime, no surgery",
    ],
    photo: "/images/hifu-clinic.jpg",
    photoCredit: null,
    photoCreditHref: null,
  },
  {
    slug: "diode-hair-removal",
    category: "All Skin & Hair Types",
    name: "Triple Wavelength Diode Laser",
    tagline: "Permanent Hair Removal",
    duration: "30–120 min",
    summary:
      "Triple-wavelength diode laser combines three powerful wavelengths in one session to target hair follicles at different depths simultaneously.",
    benefits: [
      "Virtually pain-free",
      "Fast and highly effective",
      "Works for all skin and hair types, year-round",
    ],
    photo:
      "https://images.unsplash.com/photo-1785861775561-c6db7da314a0?q=80&w=1400&auto=format&fit=crop",
    photoCredit: "Photo by Sum Sum on Unsplash",
    photoCreditHref: "https://unsplash.com/@surprisechef",
  },
  {
    slug: "pico-laser",
    category: "Pigmentation & Uneven Tone",
    name: "Pico Laser with ProRestore",
    tagline: "For Pigmentation and Acne Skin",
    duration: "30–50 min",
    summary:
      "SnowLight Pico Laser lightens pigmentation and chloasma while firming and shrinking pores.",
    benefits: [
      "Fragments pigment, no heat damage",
      "Firms pores & texture",
      "Zero downtime",
    ],
    photo:
      "https://images.unsplash.com/photo-1713085085470-fba013d67e65?q=80&w=1400&auto=format&fit=crop",
    photoCredit: "Photo by Look Studio on Unsplash",
    photoCreditHref: "https://unsplash.com/@lookphoto",
  },
];
