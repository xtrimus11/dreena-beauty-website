// Unifies the two treatment data sources so every "View Treatment" link in
// the app (Home's best-sellers list, the Treatments page grid, and Skin
// Analysis recommendations) resolves to a real detail page.
//
// Almost everything comes from allTreatments.ts (the 23-item menu behind
// /treatments). Two real best-sellers on the Home page — Exosome Treatment
// with MTS and Triple Wavelength Diode Laser — aren't part of that list
// (hair removal doesn't fit the skin-concern categories used there), so
// they're merged in from data/treatments.ts to give them a page too.
import { TREATMENTS as ALL_TREATMENTS, photoFor, type TreatmentEntry } from "./allTreatments";
import { TREATMENTS as BEST_SELLERS, type Treatment } from "./treatments";

export interface TreatmentDetail {
  slug: string;
  name: string;
  category: string;
  duration: string;
  summary: string;
  benefits: string[];
  photo: string;
  photoCredit: string | null;
  photoCreditHref: string | null;
}

function fromEntry(t: TreatmentEntry): TreatmentDetail {
  const photo = photoFor(t);
  return {
    slug: t.slug,
    name: t.name,
    category: t.category,
    duration: t.duration,
    summary: t.summary,
    benefits: t.benefits,
    photo: photo.src,
    photoCredit: photo.credit,
    photoCreditHref: photo.creditHref,
  };
}

function fromBestSeller(t: Treatment): TreatmentDetail {
  return {
    slug: t.slug,
    name: t.name,
    category: t.category,
    duration: t.duration,
    summary: t.summary,
    benefits: t.benefits,
    photo: t.photo,
    photoCredit: t.photoCredit,
    photoCreditHref: t.photoCreditHref,
  };
}

const EXTRA_BEST_SELLERS = BEST_SELLERS.filter(
  (bs) => !ALL_TREATMENTS.some((t) => t.slug === bs.slug)
);

export const ALL_DETAILS: TreatmentDetail[] = [
  ...ALL_TREATMENTS.map(fromEntry),
  ...EXTRA_BEST_SELLERS.map(fromBestSeller),
];

export function getTreatmentDetail(slug: string): TreatmentDetail | undefined {
  return ALL_DETAILS.find((t) => t.slug === slug);
}

// Same fallback the old TreatmentDetail.dc.html used: prefer same-category
// treatments, fall back to any others if the category has nothing else.
export function relatedTreatments(slug: string, count = 3): TreatmentDetail[] {
  const current = getTreatmentDetail(slug);
  if (!current) return [];
  const sameCategory = ALL_DETAILS.filter((t) => t.slug !== slug && t.category === current.category);
  const pool = sameCategory.length ? sameCategory : ALL_DETAILS.filter((t) => t.slug !== slug);
  return pool.slice(0, count);
}
