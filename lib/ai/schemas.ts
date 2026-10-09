import { z } from "zod";

const text = z.string().trim().min(1);
const money = z.number().nonnegative();
const costItem = z.object({ item: text, amount: money });

export const clarifySchema = z.object({
  needs_clarification: z.boolean(),
  questions: z.array(text).max(3),
});
export type ClarifyOutput = z.infer<typeof clarifySchema>;

export const studioPlanSchema = z.object({
  business_name: text,
  plan: z.object({
    summary: text,
    products: z.array(z.object({ name: text, description: text, price_azn: money })).min(1).max(8),
    target_audience: text,
    pricing_strategy: text,
    marketing_plan: z.array(text).min(3).max(8),
    roadmap: z
      .array(
        z.object({
          month: z.number().int().min(1).max(6),
          title: text,
          tasks: z.array(text).min(1).max(5),
        }),
      )
      .min(3)
      .max(6),
  }),
  financials: z.object({
    startup_costs: z.array(costItem).min(2).max(10),
    monthly_costs: z.array(costItem).min(2).max(10),
    // Expected revenue for months 1..12. Totals and break-even are computed in code.
    monthly_revenue: z.array(money).min(6).max(12),
  }),
  locations: z
    .array(
      z.object({
        name: text,
        place_id: z.string().nullish(),
        lat: z.number().nullish(),
        lng: z.number().nullish(),
        reason: text,
        estimated_rent_azn: money,
        fit_score: z.number().min(0).max(100),
      }),
    )
    .length(3),
  branding: z.object({
    name_ideas: z.array(text).min(3).max(3),
    slogans: z.array(text).min(3).max(3),
    visual_style: z.object({
      style: text,
      colors: z.array(z.string()).min(2).max(4),
      logo_concept: text,
    }),
  }),
  extra_ideas: z.object({
    campaigns: z.array(text).min(2).max(5),
    social_posts: z.array(text).min(2).max(5),
    popup_store: text,
  }),
});
export type StudioPlanOutput = z.infer<typeof studioPlanSchema>;

// Request bodies
export const studioRequestSchema = z.object({
  mode: z.enum(["clarify", "plan"]),
  idea: z.string().trim().min(10).max(4000),
  answers: z
    .array(z.object({ question: z.string().max(500), answer: z.string().max(2000) }))
    .max(3)
    .optional(),
});

export const brandingRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slogan: z.string().max(200).optional(),
  product: z.string().max(500).optional(),
  visual_style: z
    .object({
      style: z.string().max(300),
      colors: z.array(z.string().max(20)).max(4),
      logo_concept: z.string().max(500),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Analysis agent
// ---------------------------------------------------------------------------

const score = z.number().min(0).max(100);
const fit = z.object({ score, reason: text });
const sourceId = z.string().nullish();

export const analysisSchema = z.object({
  overall_score: score,
  summary: text,
  market_fit: z.object({ baku: fit, regions: fit, online: fit }),
  swot: z.object({
    strengths: z.array(text).min(2).max(5),
    weaknesses: z.array(text).min(2).max(5),
    opportunities: z.array(text).min(2).max(5),
    threats: z.array(text).min(2).max(5),
  }),
  location_analysis: z.object({
    assessment: text,
    alternatives: z.array(z.object({ name: text, reason: text })).max(3),
  }),
  budget_check: z
    .array(z.object({ category: text, status: z.enum(["low", "ok", "high"]), comment: text }))
    .min(2)
    .max(8),
  competitors: z
    .array(z.object({ name: text, description: text, differentiation: text, source_id: sourceId }))
    .max(6),
  recommendations: z
    .array(z.object({ priority: z.enum(["high", "medium", "low"]), title: text, detail: text }))
    .min(3)
    .max(8),
  key_figures: z.array(z.object({ label: text, value: text, source_id: sourceId })).min(2).max(10),
});
export type AnalysisOutput = z.infer<typeof analysisSchema>;
