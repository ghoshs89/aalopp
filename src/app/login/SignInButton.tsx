"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInButton() {
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setBusy(false);
  };
  return (
    <button onClick={signIn} disabled={busy} className="big-button bg-cream text-ink disabled:opacity-60">
      {busy ? "Opening Google..." : "Sign in with Google"}
    </button>
  );
}
