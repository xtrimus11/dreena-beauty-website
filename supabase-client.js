// Shared Supabase client + data-access helpers for Skin Analysis
// submissions. Requires the Supabase JS UMD bundle to already be loaded
// (see the <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/..."> tag
// in each page's <helmet>), which exposes window.supabase.createClient.
//
// Schema this expects (see project setup notes):
//   table  skin_analysis_submissions (id, created_at, customer_name,
//          customer_contact, skin_type, concerns jsonb, tags jsonb,
//          answers jsonb, photo_url text)         -- photo_url holds a
//          STORAGE PATH, not a public URL (the bucket is private) —
//          resolve a viewable link with getPhotoSignedUrl().
//   bucket skin-analysis-photos (private)
// RLS: anon may INSERT submissions/photos; only an authenticated user
// (you, signed in via Supabase Auth) may SELECT/DELETE them.

const SUPABASE_URL = 'https://nwahwmhihaukykrgdgft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53YWh3bWhpaGF1a3lrcmdkZ2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDQ1NTcsImV4cCI6MjEwMTkyMDU1N30.YR4Nz5pkMZFKSa_gFOtUEX-Y0S4yoqS-1gxoKGvkkrQ';
const BUCKET = 'skin-analysis-photos';
const TABLE = 'skin_analysis_submissions';

let _client = null;
function getClient() {
  if (_client) return _client;
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error('Supabase JS library not loaded — check the CDN <script> tag in this page\'s <helmet>.');
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// Inserts one submission row, uploading the photo first (if present). A
// photo-upload failure never blocks saving the rest of the submission —
// it just lands with photo_url: null.
export async function submitAnalysis({ customerName, customerContact, photoDataUrl, answers, skinType, concerns, tags }) {
  const client = getClient();
  let photoPath = null;

  if (photoDataUrl) {
    try {
      const blob = await dataUrlToBlob(photoDataUrl);
      const ext = (blob.type && blob.type.split('/')[1]) || 'webp';
      photoPath = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      const { error: uploadError } = await client.storage.from(BUCKET).upload(photoPath, blob, {
        contentType: blob.type || 'image/webp',
      });
      if (uploadError) throw uploadError;
    } catch (e) {
      console.error('[dreena] photo upload failed — saving submission without a photo', e);
      photoPath = null;
    }
  }

  // No .select() after insert on purpose: chaining it asks PostgREST to
  // read the row back and hand it to us, which is itself a SELECT — and
  // anon has no SELECT policy here (deliberately, so a customer can't
  // read other customers' submissions). Skipping .select() makes this a
  // write-only insert (Prefer: return=minimal), which only needs the
  // INSERT policy to succeed.
  const { error } = await client.from(TABLE).insert({
    customer_name: customerName,
    customer_contact: customerContact || null,
    skin_type: skinType,
    concerns,
    tags,
    answers,
    photo_url: photoPath,
  });

  if (error) throw error;
}

// ---- Owner auth + reads (Submissions.dc.html) ----

export async function signIn(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await getClient().auth.signOut();
}

export async function getSession() {
  const { data } = await getClient().auth.getSession();
  return data.session;
}

// Fires cb(session) on sign-in/sign-out. Returns the subscription so the
// caller can unsubscribe on unmount.
export function onAuthChange(cb) {
  const { data } = getClient().auth.onAuthStateChange((_event, session) => cb(session));
  return data.subscription;
}

export async function fetchSubmissions() {
  const { data, error } = await getClient()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Private bucket, so viewing a photo needs a short-lived signed URL —
// only an authenticated (owner) session can generate one, per the storage
// RLS policy.
export async function getPhotoSignedUrl(path) {
  if (!path) return null;
  const { data, error } = await getClient().storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) {
    console.warn('[dreena] could not sign photo url', error);
    return null;
  }
  return data.signedUrl;
}
