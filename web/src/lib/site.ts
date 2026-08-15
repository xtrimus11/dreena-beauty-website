// Central place for links out to the live d'reena beauty site. The rest of
// the site (Treatments, Blog, About, Contact, Skin Analysis, Dermalogica)
// still lives on the original static build for now — this Next.js app is
// currently the homepage only, so anything not yet rebuilt here links out.
export const LIVE_SITE = "https://xtrimus11.github.io/dreena-beauty-website";
export const WHATSAPP_URL = "https://wa.me/60123456789";

export const LIVE_LINKS = {
  home: `${LIVE_SITE}/Home.dc.html`,
  treatments: `${LIVE_SITE}/Treatments.dc.html`,
  skinAnalysis: `${LIVE_SITE}/SkinAnalysis.dc.html`,
  about: `${LIVE_SITE}/About.dc.html`,
  dermalogica: `${LIVE_SITE}/Dermalogica.dc.html`,
  blog: `${LIVE_SITE}/Blog.dc.html`,
  contact: `${LIVE_SITE}/Contact.dc.html`,
  treatment: (slug: string) => `${LIVE_SITE}/TreatmentDetail.dc.html?t=${slug}`,
  blogPost: (slug: string) => `${LIVE_SITE}/BlogPost.dc.html?slug=${slug}`,
};
