"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Deliberately vague: never reveal whether the address exists.
      setError("That email and password do not match.");
      setBusy(false);
      return;
    }

    // Only follow `next` if it is an internal staff path — an open redirect
    // here would let a crafted link bounce someone off-site after sign-in.
    const next = searchParams.get("next");
    const target = next?.startsWith("/staff") && !next.startsWith("//") ? next : "/staff";
    router.replace(target);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-2.5 text-base outline-none focus:border-[#8a6f4f] focus:ring-2 focus:ring-[#e9d9c1]"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[rgba(10,10,10,0.16)] bg-white px-3 py-2.5 text-base outline-none focus:border-[#8a6f4f] focus:ring-2 focus:ring-[#e9d9c1]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-[#fdf0ef] px-3 py-2 text-sm text-[#9f1239]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
