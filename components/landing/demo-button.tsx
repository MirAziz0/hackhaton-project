"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

// "Watch demo": signs in with the public demo account and opens the app.
// If that fails for any reason, the visitor lands on the sign-in page instead.
export function DemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function openDemo() {
    setLoading(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={openDemo}
      disabled={loading}
      className="inline-flex h-12 items-center gap-2.5 rounded-xl border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-70"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      Demoya bax
    </button>
  );
}
