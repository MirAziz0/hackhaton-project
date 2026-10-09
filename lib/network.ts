import { lookingForLabel, trackLabel } from "@/lib/constants";
import { sourceText, type Translate } from "@/lib/i18n/translate";
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

export const MATCH_CANDIDATE_LIMIT = 12;
export const MATCH_RESULT_LIMIT = 5;

// Orders pre-filtered candidates: same track first, then the same city, then related tracks.
export function rankCandidates(me: PublicProfile, candidates: PublicProfile[]) {
  const score = (candidate: PublicProfile) =>
    (candidate.track === me.track ? 4 : 0) +
    (candidate.city && me.city && candidate.city.split(",")[0] === me.city.split(",")[0] ? 1 : 0) +
    (candidate.bio ? 1 : 0);
  return [...candidates].sort((a, b) => score(b) - score(a)).slice(0, MATCH_CANDIDATE_LIMIT);
}

// The candidates the Matching agent considers: the user's own track plus related ones.
export function matchCandidates(me: PublicProfile, others: PublicProfile[]) {
  const own = me.track ?? "other";
  const tracks: string[] = [own, ...RELATED_TRACKS[own]];
  return rankCandidates(
    me,
    others.filter((profile) => profile.id !== me.id && profile.track !== null && tracks.includes(profile.track)),
  );
}

// One-sentence reason built only from profile facts. Shown while the AI ranking is still
// loading and whenever it is unavailable.
export function fallbackReason(me: PublicProfile, candidate: PublicProfile, t: Translate = sourceText) {
  const track = t(trackLabel(candidate.track));
  const values = {
    track,
    trackLower: track.toLowerCase(),
    looking: candidate.looking_for?.map((item) => t(lookingForLabel(item))).join(", ").toLowerCase() ?? "",
  };
  if (candidate.track === me.track) {
    return values.looking
      ? t("Siz də {trackLower} sahəsində fəaliyyət göstərirsiniz, o isə {looking} axtarır.", values)
      : t("Siz də {trackLower} sahəsində fəaliyyət göstərirsiniz.", values);
  }
  return values.looking
    ? t("{track} sahəsində fəaliyyət göstərir, o isə {looking} axtarır.", values)
    : t("{track} sahəsində fəaliyyət göstərir.", values);
}

export function fallbackMatches(me: PublicProfile, candidates: PublicProfile[], t: Translate = sourceText): Match[] {
  return candidates
    .slice(0, MATCH_RESULT_LIMIT)
    .map((profile) => ({ profile, reason: fallbackReason(me, profile, t), ai: false }));
}
