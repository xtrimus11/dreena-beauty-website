// Real customer reviews pulled from d'reena beauty's Google Maps listing
// (4.6★ average, 57 reviews as of Aug 2026). Quotes are trimmed to complete
// sentences where Google truncated the review text — nothing paraphrased or
// invented. Source: https://maps.app.goo.gl/ — search "d'reena beauty
// Seremban" on Google Maps.
export interface Review {
  name: string;
  meta: string;
  rating: number;
  timeAgo: string;
  quote: string;
}

export const GOOGLE_RATING = 4.6;
export const GOOGLE_REVIEW_COUNT = 57;
export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/d'reena+beauty+-+Facial+%26+Skin+Treatment+Seremban./@2.6955073,101.9076264,17z/data=!4m8!3m7!1s0x31cde7cddcfc82d7:0xfdd6333a49c4e762!8m2!3d2.6955073!4d101.9102013!9m1!1b1!16s%2Fg%2F1vzqpsbs";

// The Senawang branch (d'sensations beauty) has its own separate Google
// Maps listing, under "DERMALOGICA d sensations".
export const SENAWANG_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/DERMALOGICA+d+sensations/@2.704046,101.9878711,17z/data=!3m1!4b1!4m6!3m5!1s0x31cde0b0c0076c5b:0xa65d245956e1c2d4!8m2!3d2.704046!4d101.990446!16s%2Fg%2F11c5355lf2";

export const REVIEWS: Review[] = [
  {
    name: "fatin aqilah",
    meta: "1 review",
    rating: 5,
    timeAgo: "3 months ago",
    quote:
      "The consultant explained my skin condition in detail, about my hydration, pores and sebum. She also recommended me which treatment should i get based on my skin concern. The therapist named qis also did a great job for my treatment.",
  },
  {
    name: "Vinnie Leong",
    meta: "5 reviews · 2 photos",
    rating: 5,
    timeAgo: "a year ago",
    quote:
      "Excellent service! One of the staff was kind enough to go through my personal skincare products and let me know what works and what doesn't. I really appreciated their service and would definitely come back again.",
  },
  {
    name: "Khoo Pek San",
    meta: "3 reviews · 1 photo",
    rating: 4,
    timeAgo: "3 years ago",
    quote:
      "D'reena beauty is a great place for a relaxing facial spot. I always feel brighter and relax after a facial treatment/massage. Their therapists are well train and the salon is clean.",
  },
  {
    name: "Nrllyna 9",
    meta: "9 reviews · 1 photo",
    rating: 5,
    timeAgo: "3 years ago",
    quote:
      "The treatment room is clean and comfy, hence highly recommend. My facial therapist is very professional, skilful and would communicate and explain to me what she was going to do. Consistent in every facial.",
  },
  {
    name: "Kah Mun Hew",
    meta: "Local Guide · 11 reviews · 1 photo",
    rating: 5,
    timeAgo: "3 years ago",
    quote:
      "This has been my regular beauty parlour for facial treatments for many years. I always have a relaxing and restful experience here. One facial therapist that particularly stands out to me is Sally, who is skilled at both facials and massages.",
  },
  {
    name: "Wong Shiawrun",
    meta: "1 review",
    rating: 5,
    timeAgo: "3 years ago",
    quote:
      "I was on skinlase program for a couple of months and result was fantastic. My freckles subside to almost nil. My beautician (Joe), not only did a good facial job but is able to advice me almost anything.",
  },
];
