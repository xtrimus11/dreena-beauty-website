// Shared storage for Skin Analysis submissions (customer name, optional
// contact, selfie photo, quiz answers, and computed result).
//
// TEMPORARY STORAGE NOTICE: this currently persists to the browser's own
// localStorage only — each submission is saved on the customer's own
// device/browser, not to a shared server. That means:
//   - You (the owner) can only see submissions made from a browser you
//     control (e.g. if a customer fills it out on your salon iPad).
//   - Clearing browser data, or a customer using a different device,
//     loses/hides those entries.
// This is a placeholder until a real database is wired in (Supabase,
// Airtable, Google Sheets, etc.) — ask Claude to connect one so every
// submission lands in one place you can access from anywhere.
//
// Optional remote sync: if `window.DREENA_SUBMIT_ENDPOINT` is set to a URL
// before this script runs, every submission is also POSTed there as JSON
// (fire-and-forget — a failure here never blocks the local save). Left
// unset by default.

const STORE_KEY = 'dreena_skin_analysis_submissions';

export function saveSubmission(entry) {
  const record = {
    id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    submittedAt: new Date().toISOString(),
    ...entry,
  };

  const list = loadSubmissions();
  list.unshift(record);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('[dreena] could not save skin analysis submission locally', e);
  }

  if (typeof window !== 'undefined' && window.DREENA_SUBMIT_ENDPOINT) {
    fetch(window.DREENA_SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch((e) => console.warn('[dreena] remote submission sync failed', e));
  }

  return record;
}

export function loadSubmissions() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function clearSubmissions() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (e) {
    // ignore
  }
}

// Reads the current image out of an <image-slot>'s shadow DOM. image-slot
// has no public JS API for this (by design it's a drop-in web component),
// so we read its rendered <img src> directly — only a user-dropped photo
// ever produces a data: URL here, since we never set a fallback `src`.
export function getImageSlotDataUrl(id) {
  try {
    const el = document.getElementById(id);
    const img = el && el.shadowRoot && el.shadowRoot.querySelector('.frame img');
    const src = img && img.getAttribute('src');
    return src && src.startsWith('data:') ? src : null;
  } catch (e) {
    return null;
  }
}
