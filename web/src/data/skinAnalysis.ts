// The Skin Analysis quiz — same 6 questions, scoring, and skin-type copy as
// the live site's SkinAnalysis.dc.html. Ported 1:1, nothing reworded.

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  key: string;
  title: string;
  options: QuestionOption[];
}

export const QUESTIONS: Question[] = [
  {
    key: "feel",
    title: "How does your skin feel by midday?",
    options: [
      { label: "Tight or dry, sometimes flaky", value: "dry" },
      { label: "Shiny all over", value: "oily" },
      { label: "Shiny only around the T-zone", value: "combo" },
      { label: "Comfortable and balanced", value: "normal" },
    ],
  },
  {
    key: "pores",
    title: "How would you describe your pores?",
    options: [
      { label: "Barely visible", value: "fine" },
      { label: "Visible around the nose and chin", value: "medium" },
      { label: "Visible all over my face", value: "large" },
    ],
  },
  {
    key: "breakouts",
    title: "Do you experience breakouts?",
    options: [
      { label: "Rarely", value: "rare" },
      { label: "Occasionally", value: "occasional" },
      { label: "Frequently", value: "frequent" },
    ],
  },
  {
    key: "tone",
    title: "Any dark spots, sun spots or uneven tone?",
    options: [
      { label: "None that I notice", value: "none" },
      { label: "A few, here and there", value: "some" },
      { label: "Yes, quite noticeable", value: "noticeable" },
    ],
  },
  {
    key: "lines",
    title: "How about fine lines or loss of firmness?",
    options: [
      { label: "None yet", value: "none" },
      { label: "Just starting to notice", value: "starting" },
      { label: "Visible to me", value: "visible" },
    ],
  },
  {
    key: "reactive",
    title: "Is your skin easily irritated or reactive?",
    options: [
      { label: "Rarely", value: "rare" },
      { label: "Sometimes", value: "sometimes" },
      { label: "Yes, often", value: "often" },
    ],
  },
];

const TYPE_MAP: Record<string, string> = {
  dry: "Dry",
  oily: "Oily",
  combo: "Combination",
  normal: "Normal",
};

const TYPE_BLURB: Record<string, string> = {
  Dry: "Your skin tends to feel tight and can flake — it's craving deep, lasting hydration.",
  Oily: "Your skin produces extra oil, especially through the day — balancing that is key.",
  Combination:
    "Your T-zone runs oilier while cheeks stay drier — treatments should address both.",
  Normal:
    "Your skin is fairly balanced day to day — the focus is on maintaining and boosting its glow.",
};

export interface AnalysisResult {
  skinType: string;
  blurb: string;
  tags: string[];
  concerns: string[];
}

export function computeResult(answers: Record<string, string>): AnalysisResult {
  const concerns: string[] = [];
  const tags: string[] = [];
  const a = answers;

  if (a.feel === "dry") {
    concerns.push("dryness");
    tags.push("Dryness");
  }
  if (a.feel === "oily" || a.feel === "combo" || a.pores === "large") {
    concerns.push("oily");
    tags.push("Oiliness");
  }
  if (a.breakouts === "occasional" || a.breakouts === "frequent") {
    concerns.push("acne");
    tags.push("Breakouts");
  }
  if (a.tone === "some" || a.tone === "noticeable") {
    concerns.push("pigmentation");
    tags.push("Uneven tone");
  }
  if (a.lines === "starting" || a.lines === "visible") {
    concerns.push("aging");
    tags.push("Fine lines");
  }
  if (a.reactive === "sometimes" || a.reactive === "often") {
    concerns.push("sensitivity");
    tags.push("Sensitivity");
  }
  if (!concerns.length) {
    concerns.push("dullness");
    tags.push("Dullness");
  }

  const skinType = TYPE_MAP[a.feel] || "Normal";
  return { skinType, blurb: TYPE_BLURB[skinType], tags, concerns };
}
