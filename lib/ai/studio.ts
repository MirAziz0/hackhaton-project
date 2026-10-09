import "server-only";
import { generateJson } from "@/lib/ai/llm";
import { STUDIO_CLARIFY_SYSTEM, STUDIO_PLAN_SYSTEM, studioUserPrompt } from "@/lib/ai/prompts";
import { clarifySchema, studioPlanSchema } from "@/lib/ai/schemas";
import { buildForecast } from "@/lib/finance/forecast";
import { resolveCoordinates } from "@/lib/places";
import type { Profile } from "@/types/database";
import type { StudioBusiness } from "@/types/studio";

type Answer = { question: string; answer: string };

// Step 1: decide whether the idea needs 2-3 clarifying questions.
export async function clarifyIdea(profile: Profile, idea: string): Promise<string[]> {
  const output = await generateJson({
    schema: clarifySchema,
    system: STUDIO_CLARIFY_SYSTEM,
    user: studioUserPrompt(profile, idea),
    fast: true,
  });
  return output.needs_clarification ? output.questions.slice(0, 3) : [];
}

function cleanHexColors(colors: string[]) {
  const valid = colors.map((color) => color.trim()).filter((color) => /^#[0-9a-f]{6}$/i.test(color));
  return valid.length >= 2 ? valid : ["#4338CA", "#F59E0B"];
}

// Step 2: generate the full plan. The model writes the content; code does the math and the geo lookup.
export async function generatePlan(profile: Profile, idea: string, answers: Answer[]): Promise<StudioBusiness> {
  const output = await generateJson({
    schema: studioPlanSchema,
    system: STUDIO_PLAN_SYSTEM,
    user: studioUserPrompt(profile, idea, answers),
  });

  return {
    name: output.business_name,
    idea_text: idea,
    plan: {
      ...output.plan,
      roadmap: [...output.plan.roadmap].sort((a, b) => a.month - b.month),
      extra_ideas: output.extra_ideas,
    },
    financial_forecast: buildForecast(output.financials),
    locations: output.locations.map((location, index) => ({
      name: location.name,
      reason: location.reason,
      estimated_rent_azn: Math.round(location.estimated_rent_azn),
      fit_score: Math.round(location.fit_score),
      ...resolveCoordinates(location, index, profile.city),
    })),
    branding: {
      name_ideas: output.branding.name_ideas,
      slogans: output.branding.slogans,
      logo_urls: [],
      banner_url: null,
      visual_style: {
        ...output.branding.visual_style,
        colors: cleanHexColors(output.branding.visual_style.colors),
      },
    },
  };
}
