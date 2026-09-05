"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/staff/login");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="underline underline-offset-2">
      Sign out
    </button>
  );
}
