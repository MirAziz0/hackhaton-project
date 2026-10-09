import { budgetLabel, lookingForLabel, stageLabel, trackLabel } from "@/lib/constants";
import { PLACES } from "@/lib/places";
import type { Profile } from "@/types/database";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const LANGUAGE_RULES = `Language and style rules:
- Write every user-facing string in Azerbaijani (Latin script). Be concise and professional.
- Currency is AZN. All amounts are plain numbers in AZN, without currency symbols or separators.
- Respond with a single JSON object only. No markdown, no commentary.`;

export function profileContext(profile: Profile) {
  return [
    `Name: ${profile.full_name || "unknown"}`,
    `Business track: ${trackLabel(profile.track)}`,
    `Stage: ${stageLabel(profile.stage)}`,
    `Location: ${profile.city || "Bakı"}`,
    `Starting budget: ${budgetLabel(profile.budget_range)}`,
    `Products or services: ${profile.products || "not specified"}`,
    `Target customer: ${profile.target_customer || "not specified"}`,
    `Looking for: ${profile.looking_for?.map(lookingForLabel).join(", ") || "not specified"}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Studio agent
// ---------------------------------------------------------------------------

export const STUDIO_CLARIFY_SYSTEM = `You are the Idea Studio agent of LaunchLens AI, a platform for entrepreneurs in Azerbaijan.
The user describes a business idea. You already know their onboarding profile, so NEVER ask about anything the profile or the idea text already answers (track, budget, location, products, target customer).

Decide whether you need more information to write a concrete business plan.
- If the idea is already specific enough, set "needs_clarification" to false and return an empty "questions" array.
- Otherwise ask 2 or 3 short, specific questions whose answers would materially change the plan (for example: sales channel, team size, what makes the offer different, production capacity).

${LANGUAGE_RULES}

JSON shape:
{ "needs_clarification": boolean, "questions": string[] }`;

export const STUDIO_PLAN_SYSTEM = `You are the Idea Studio agent of LaunchLens AI, a platform for entrepreneurs in Azerbaijan.
Turn the user's idea into a realistic, concrete starting plan for the Azerbaijani market. Use the onboarding profile as context so the user never has to repeat information. Respect the stated budget: startup costs should fit inside the budget range.

Rules:
- Prices, rents, salaries and revenues must be realistic for Azerbaijan and are estimates.
- "monthly_revenue" has exactly 12 numbers: expected revenue for months 1 to 12, starting modestly and growing realistically. Do NOT calculate totals, profit or break-even; the application computes them.
- "roadmap" has exactly 6 entries, one per month (month 1 to 6).
- "locations" has exactly 3 suggestions in or near the user's city. When a suggestion matches an entry in the known places list, set "place_id" to that entry's id and leave "lat" and "lng" null. Only when no listed place fits, set "place_id" to null and give approximate "lat" and "lng". For an online-only business, suggest locations for a pick-up point, small warehouse or pop-up stand. "fit_score" is 0-100. "estimated_rent_azn" is the monthly rent for a suitably sized space.
- "branding.visual_style.colors" has 2 or 3 hex colours such as "#1F7A5C". "logo_concept" describes a simple logo idea in English (it is used as an image prompt and is not shown to the user). "style" is also in English.
- "name_ideas" has 3 short brand names; the first one must equal "business_name". "slogans" has 3 slogans.

${LANGUAGE_RULES}

Known places (id | name | city):
${PLACES.map((place) => `${place.id} | ${place.name} | ${place.city}`).join("\n")}

JSON shape:
{
  "business_name": string,
  "plan": {
    "summary": string,
    "products": [{ "name": string, "description": string, "price_azn": number }],
    "target_audience": string,
    "pricing_strategy": string,
    "marketing_plan": string[],
    "roadmap": [{ "month": number, "title": string, "tasks": string[] }]
  },
  "financials": {
    "startup_costs": [{ "item": string, "amount": number }],
    "monthly_costs": [{ "item": string, "amount": number }],
    "monthly_revenue": number[]
  },
  "locations": [{ "name": string, "place_id": string | null, "lat": number | null, "lng": number | null, "reason": string, "estimated_rent_azn": number, "fit_score": number }],
  "branding": {
    "name_ideas": string[],
    "slogans": string[],
    "visual_style": { "style": string, "colors": string[], "logo_concept": string }
  },
  "extra_ideas": { "campaigns": string[], "social_posts": string[], "popup_store": string }
}`;

export function studioUserPrompt(
  profile: Profile,
  idea: string,
  answers: { question: string; answer: string }[] = [],
) {
  const answered = answers.filter((item) => item.answer.trim());
  return [
    "ONBOARDING PROFILE",
    profileContext(profile),
    "",
    "BUSINESS IDEA",
    idea,
    ...(answered.length
      ? ["", "CLARIFYING ANSWERS", ...answered.map((item) => `Q: ${item.question}\nA: ${item.answer}`)]
      : []),
    "",
    "Return the JSON object.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Branding agent (image prompts)
// ---------------------------------------------------------------------------

interface BrandingPromptInput {
  name: string;
  slogan?: string;
  product?: string;
  style?: string;
  colors?: string[];
  logoConcept?: string;
}

function palette(colors: string[] | undefined) {
  return colors?.length ? `Colour palette: ${colors.join(", ")}.` : "";
}

export function logoPrompt(input: BrandingPromptInput, variant: number) {
  const direction =
    variant === 0
      ? "A minimal symbol-based logo mark (icon only)."
      : "A modern monogram logo built from the brand's first letter.";
  return [
    `Logo design for a brand named "${input.name}".`,
    input.product ? `The business sells: ${input.product}.` : "",
    direction,
    input.logoConcept ? `Concept: ${input.logoConcept}.` : "",
    input.style ? `Style: ${input.style}.` : "Style: clean, modern, professional.",
    palette(input.colors),
    "Flat vector style, centred on a plain white background, high contrast, no mockup, no photo, no extra text.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function bannerPrompt(input: BrandingPromptInput) {
  return [
    `Wide promotional banner for a brand named "${input.name}".`,
    input.product ? `The business sells: ${input.product}.` : "",
    input.style ? `Style: ${input.style}.` : "Style: clean, modern, professional.",
    palette(input.colors),
    "Attractive product-focused composition with generous empty space, soft lighting, no text, no letters, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");
}
