import "server-only";
import { generateJson } from "@/lib/ai/llm";
import { matchingSystem, matchingUserPrompt } from "@/lib/ai/prompts";
import { matchingSchema } from "@/lib/ai/schemas";
import type { Locale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";
import { MATCH_RESULT_LIMIT, fallbackReason, type Match, type PublicProfile } from "@/lib/network";

// Matching agent: the LLM ranks the pre-filtered candidates and writes one reason for each.
// Returned ids are checked against the candidate list, so the model cannot introduce a profile.
export async function rankMatches(me: PublicProfile, candidates: PublicProfile[], locale: Locale): Promise<Match[]> {
  if (!candidates.length) return [];

  const output = await generateJson({
    schema: matchingSchema,
    system: matchingSystem(locale),
    user: matchingUserPrompt(me, candidates, locale),
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
      matches.push({ profile: candidate, reason: fallbackReason(me, candidate, createTranslator(locale)), ai: false });
    }
  }
  return matches;
}
