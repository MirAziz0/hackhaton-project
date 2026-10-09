import { sumAmounts } from "@/lib/finance/forecast";
import type { Business } from "@/types/database";

const MAX_PLAN_CHARS = 15_000;

export function truncatePlan(text: string) {
  return text.length > MAX_PLAN_CHARS ? `${text.slice(0, MAX_PLAN_CHARS)}\n[...]` : text;
}

// Flattens a saved Studio business into plain text for the Analysis agent.
export function planTextFromBusiness(business: Business) {
  const lines: string[] = [`Business name: ${business.name}`];
  if (business.idea_text) lines.push(`Idea: ${business.idea_text}`);

  const { plan, financial_forecast: forecast, locations } = business;
  if (plan) {
    lines.push(
      `Summary: ${plan.summary}`,
      `Products: ${plan.products.map((p) => `${p.name} (${p.price_azn} AZN) - ${p.description}`).join("; ")}`,
      `Target audience: ${plan.target_audience}`,
      `Pricing strategy: ${plan.pricing_strategy}`,
      `Marketing plan: ${plan.marketing_plan.join("; ")}`,
      `Roadmap: ${plan.roadmap.map((step) => `month ${step.month}: ${step.title}`).join("; ")}`,
    );
  }
  if (forecast) {
    const revenue = forecast.monthly_projection.map((month) => month.revenue);
    lines.push(
      `Startup costs (total ${sumAmounts(forecast.startup_costs)} AZN): ${forecast.startup_costs.map((c) => `${c.item} ${c.amount}`).join("; ")}`,
      `Monthly costs (total ${sumAmounts(forecast.monthly_costs)} AZN): ${forecast.monthly_costs.map((c) => `${c.item} ${c.amount}`).join("; ")}`,
      `Expected monthly revenue (AZN): ${revenue.join(", ")}`,
      `Break-even month: ${forecast.break_even_month ?? "not reached in the projection"}`,
    );
  }
  if (locations?.length) {
    lines.push(
      `Considered locations: ${locations.map((l) => `${l.name} (rent ~${l.estimated_rent_azn} AZN/month)`).join("; ")}`,
    );
  }
  return truncatePlan(lines.join("\n"));
}

interface FormInput {
  name: string;
  idea: string;
  location: string;
  budget: string;
  products: string;
}

export function planTextFromForm(form: FormInput) {
  return truncatePlan(
    [
      `Business name: ${form.name}`,
      `Idea: ${form.idea}`,
      `Location: ${form.location || "not specified"}`,
      `Budget: ${form.budget ? `${form.budget} AZN` : "not specified"}`,
      `Products or services: ${form.products || "not specified"}`,
    ].join("\n"),
  );
}
