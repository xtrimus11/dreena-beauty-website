// Links out to the live d'reena beauty site, for the one thing not yet
// ported into this Next.js app: individual treatment detail pages
// (TreatmentDetail.dc.html). Every other page (Home, Treatments, Skin
// Analysis, About, Dermalogica, Blog, Contact) now lives here and links
// internally.
export const LIVE_SITE = "https://xtrimus11.github.io/dreena-beauty-website";
export const WHATSAPP_URL = "https://wa.me/60123456789";

export const LIVE_LINKS = {
  treatment: (slug: string) => `${LIVE_SITE}/TreatmentDetail.dc.html?t=${slug}`,
};
