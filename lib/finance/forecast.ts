import type { FinancialForecast } from "@/types/database";

interface ForecastInput {
  startup_costs: { item: string; amount: number }[];
  monthly_costs: { item: string; amount: number }[];
  monthly_revenue: number[];
}

export function sumAmounts(items: { amount: number }[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

// All forecast arithmetic happens here, in code, never in the LLM.
// Break-even is the first month in which cumulative profit covers the startup costs.
export function buildForecast(input: ForecastInput): FinancialForecast {
  const startup_costs = input.startup_costs.map((cost) => ({ ...cost, amount: Math.round(cost.amount) }));
  const monthly_costs = input.monthly_costs.map((cost) => ({ ...cost, amount: Math.round(cost.amount) }));
  const monthlyCostTotal = sumAmounts(monthly_costs);

  const monthly_projection = input.monthly_revenue.map((revenue, index) => ({
    month: index + 1,
    revenue: Math.round(revenue),
    costs: monthlyCostTotal,
  }));

  let cumulative = -sumAmounts(startup_costs);
  let break_even_month: number | null = null;
  for (const month of monthly_projection) {
    cumulative += month.revenue - month.costs;
    if (cumulative >= 0) {
      break_even_month = month.month;
      break;
    }
  }

  return { startup_costs, monthly_costs, monthly_projection, break_even_month };
}
