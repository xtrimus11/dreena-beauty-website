// Local safety net for Skin Analysis submissions — mirrors every submission
// into this browser's localStorage too, so nothing is lost if the Supabase
// write fails (network hiccup, RLS misconfig, etc). Supabase is the real,
// cross-device record; this is just a fallback.

const STORE_KEY = "dreena_skin_analysis_submissions";

export function saveSubmissionLocally(entry: Record<string, unknown>) {
  const record = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
    ...entry,
  };

  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? list : [];
    next.unshift(record);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error("[dreena] could not save skin analysis submission locally", e);
  }

  return record;
}
