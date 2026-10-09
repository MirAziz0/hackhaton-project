import "server-only";
import { generateJson } from "@/lib/ai/llm";
import { MATCHING_SYSTEM, matchingUserPrompt } from "@/lib/ai/prompts";
import { matchingSchema } from "@/lib/ai/schemas";
import { MATCH_RESULT_LIMIT, fallbackReason, type Match, type PublicProfile } from "@/lib/network";

// Matching agent: the LLM ranks the pre-filtered candidates and writes one reason for each.
// Returned ids are checked against the candidate list, so the model cannot introduce a profile.
export async function rankMatches(me: PublicProfile, candidates: PublicProfile[]): Promise<Match[]> {
  if (!candidates.length) return [];

  const output = await generateJson({
    schema: matchingSchema,
    system: MATCHING_SYSTEM,
    user: matchingUserPrompt(me, candidates),
    fast: true,
  });

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const matches: Match[] = [];
  for (const item of output.matches) {
    const profile = byId.get(item.id);
    if (!profile || matches.some((match) => match.profile.id === profile.id)) continue;
    matches.push({ profile, reason: item.reason, ai: true });
    if (matches.length === MATCH_RESULT_LIMIT) break;
  }

  // Top up from the rule-based order if the model returned fewer valid matches than needed.
  for (const candidate of candidates) {
    if (matches.length >= MATCH_RESULT_LIMIT) break;
    if (!matches.some((match) => match.profile.id === candidate.id)) {
      matches.push({ profile: candidate, reason: fallbackReason(me, candidate), ai: false });
    }
  }
  return matches;
}
