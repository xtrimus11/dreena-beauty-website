// Shared Supabase client + submission helper for the Skin Analysis quiz.
// Same project as the static site's supabase-client.js — this is an anon
// (publishable) key, meant to be public and safe in client-side code; it's
// scoped by RLS so anon can only INSERT submissions/photos, never read them
// back. Ported here rather than kept as a CDN <script> tag since this app
// bundles its own dependencies.
//
// Schema this expects:
//   table  skin_analysis_submissions (id, created_at, customer_name,
//          customer_contact, skin_type, concerns jsonb, tags jsonb,
//          answers jsonb, photo_url text)  -- photo_url holds a STORAGE
//          PATH, not a public URL (the bucket is private).
//   bucket skin-analysis-photos (private)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nwahwmhihaukykrgdgft.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53YWh3bWhpaGF1a3lrcmdkZ2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNDQ1NTcsImV4cCI6MjEwMTkyMDU1N30.YR4Nz5pkMZFKSa_gFOtUEX-Y0S4yoqS-1gxoKGvkkrQ";
const BUCKET = "skin-analysis-photos";
const TABLE = "skin_analysis_submissions";

let client: SupabaseClient | null = null;
function getClient() {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

export interface AnalysisPayload {
  customerName: string;
  customerContact: string;
  photoDataUrl: string | null;
  answers: Record<string, string>;
  skinType: string;
  concerns: string[];
  tags: string[];
}

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// Inserts one submission row, uploading the photo first (if present). A
// photo-upload failure never blocks saving the rest of the submission — it
// just lands with photo_url: null.
export async function submitAnalysis({
  customerName,
  customerContact,
  photoDataUrl,
  answers,
  skinType,
  concerns,
  tags,
}: AnalysisPayload) {
  const supabase = getClient();
  let photoPath: string | null = null;

  if (photoDataUrl) {
    try {
      const blob = await dataUrlToBlob(photoDataUrl);
      const ext = (blob.type && blob.type.split("/")[1]) || "webp";
      photoPath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(photoPath, blob, {
        contentType: blob.type || "image/webp",
      });
      if (uploadError) throw uploadError;
    } catch (e) {
      console.error("[dreena] photo upload failed — saving submission without a photo", e);
      photoPath = null;
    }
  }

  // No .select() after insert on purpose — anon has no SELECT policy here
  // (deliberately, so a customer can't read other customers' submissions).
  const { error } = await supabase.from(TABLE).insert({
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
