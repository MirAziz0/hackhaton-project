import type { LookingFor, Stage, Track } from "@/types/database";

// Profile fields that other signed-in users may see (budget is deliberately left out).
export const PUBLIC_PROFILE_COLUMNS =
  "id, full_name, avatar_url, track, stage, city, products, target_customer, bio, looking_for";

export interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  track: Track | null;
  stage: Stage | null;
  city: string | null;
  products: string | null;
  target_customer: string | null;
  bio: string | null;
  looking_for: LookingFor[];
}

export interface Match {
  profile: PublicProfile;
  reason: string;
  // False when the AI ranking was unavailable and the rule-based order was used instead.
  ai: boolean;
}

// Tracks whose founders commonly work together (suppliers, service providers, shared customers).
export const RELATED_TRACKS: Record<Track, Track[]> = {
  cosmetics: ["clothing", "it_services", "education"],
  food: ["it_services", "education", "cosmetics"],
  clothing: ["cosmetics", "it_services", "education"],
  it_services: ["education", "cosmetics", "food", "clothing"],
  education: ["it_services", "cosmetics", "food", "clothing"],
  other: ["it_services", "education", "cosmetics", "food", "clothing"],
};

export const MATCH_CANDIDATE_LIMIT = 15;
export const MATCH_RESULT_LIMIT = 5;

// Orders pre-filtered candidates: same track first, then the same city, then related tracks.
export function rankCandidates(me: PublicProfile, candidates: PublicProfile[]) {
  const score = (candidate: PublicProfile) =>
    (candidate.track === me.track ? 4 : 0) +
    (candidate.city && me.city && candidate.city.split(",")[0] === me.city.split(",")[0] ? 1 : 0) +
    (candidate.bio ? 1 : 0);
  return [...candidates].sort((a, b) => score(b) - score(a)).slice(0, MATCH_CANDIDATE_LIMIT);
}
