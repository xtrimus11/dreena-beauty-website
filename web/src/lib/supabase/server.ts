// Supabase client for Server Components, Server Actions and Route Handlers.
//
// Reads and writes the auth cookies, so the signed-in staff member's JWT
// reaches Postgres and RLS applies to every query.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Harmless: the middleware refreshes the session on every request,
          // so the write here is redundant rather than lost.
        }
      },
    },
  });
}
