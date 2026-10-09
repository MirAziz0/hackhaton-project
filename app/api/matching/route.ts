import { NextResponse } from "next/server";
import { rankMatches } from "@/lib/ai/matching";
import {
  PUBLIC_PROFILE_COLUMNS,
  RELATED_TRACKS,
  fallbackMatches,
  rankCandidates,
  type PublicProfile,
} from "@/lib/network";
import { getSessionProfile } from "@/lib/supabase/server";
import { getLocale, getT } from "@/lib/i18n/server";

export const maxDuration = 60;

export async function GET() {
  const t = await getT();
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) return NextResponse.json({ error: t("Davam etmək üçün daxil olun.") }, { status: 401 });

  // Step 1: pre-filter in SQL — the user's own track plus related tracks, excluding the user.
  const track = profile.track ?? "other";
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .neq("id", user.id)
    .eq("onboarding_completed", true)
    .in("track", [track, ...RELATED_TRACKS[track]])
    .limit(60);
  if (error) return NextResponse.json({ error: t("Sahibkarları yükləmək mümkün olmadı.") }, { status: 500 });

  const me: PublicProfile = profile;
  const candidates = rankCandidates(me, (data as unknown as PublicProfile[] | null) ?? []);
  if (!candidates.length) return NextResponse.json({ matches: [] });

  // Step 2: the LLM picks the best five and explains each. If it fails, the rule-based order
  // is returned instead so the page is never empty.
  try {
    return NextResponse.json({ matches: await rankMatches(me, candidates, await getLocale()) });
  } catch (err) {
    console.error("[matching] AI ranking failed, using rule-based order:", err instanceof Error ? err.message : err);
    return NextResponse.json({ matches: fallbackMatches(me, candidates, t) });
  }
}
