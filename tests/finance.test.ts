import assert from "node:assert/strict";
import { test } from "node:test";
import {
  categoryBreakdown,
  comparePeriods,
  monthlySeries,
  percentChange,
  resolvePeriod,
  simulatePriceChange,
  summarize,
} from "@/lib/finance/dashboard";
import { buildForecast } from "@/lib/finance/forecast";
import { createTranslator } from "@/lib/i18n/translate";
import type { Transaction } from "@/types/database";

// The numbers the AI assistant quotes come from these functions, never from the model.

const TODAY = "2026-03-15";
let nextId = 0;
function tx(date: string, type: "income" | "expense", category: string, amount: number): Transaction {
  nextId += 1;
  return { id: String(nextId), business_id: "b", date, type, category, amount, note: null, created_at: date };
}

const LEDGER = [
  tx("2026-02-03", "income", "Satış", 4000),
  tx("2026-02-10", "expense", "İcarə", 1000),
  tx("2026-02-20", "expense", "Reklam", 500),
  tx("2026-03-02", "income", "Satış", 3000),
  tx("2026-03-05", "expense", "İcarə", 1000),
  tx("2026-03-09", "expense", "Reklam", 1250.5),
];

test("summarize totals a period and computes the margin", () => {
  const february = summarize(LEDGER, resolvePeriod("last_month", TODAY)!);
  assert.deepEqual(
    { income: february.income, expenses: february.expenses, net: february.net_profit, margin: february.margin_pct },
    { income: 4000, expenses: 1500, net: 2500, margin: 62.5 },
  );
});

test("a period without income has no margin instead of a division by zero", () => {
  const summary = summarize([tx("2026-03-01", "expense", "İcarə", 900)], resolvePeriod("this_month", TODAY)!);
  assert.equal(summary.net_profit, -900);
  assert.equal(summary.margin_pct, null);
});

test("an unknown period is rejected so the assistant cannot guess a date range", () => {
  assert.equal(resolvePeriod("last_week", TODAY), null);
  assert.equal(resolvePeriod("2026-13", TODAY), null);
  assert.deepEqual(resolvePeriod("2024-02", TODAY), { from: "2024-02-01", to: "2024-02-29", label: "Fevral 2024" });
});

test("expense shares are sorted largest first and add up to 100%", () => {
  const { total, categories } = categoryBreakdown(LEDGER, resolvePeriod("this_month", TODAY)!);
  assert.equal(total, 2250.5);
  assert.deepEqual(categories.map((item) => item.category), ["Reklam", "İcarə"]);
  assert.ok(Math.abs(categories.reduce((sum, item) => sum + item.share_pct, 0) - 100) < 0.2);
});

test("comparing two months explains a profit drop by category", () => {
  const result = comparePeriods(LEDGER, resolvePeriod("this_month", TODAY)!, resolvePeriod("last_month", TODAY)!);
  assert.equal(result.change_a_vs_b.net_profit.absolute, -1750.5);
  assert.equal(result.expenses_by_category[0].category, "Reklam");
  assert.equal(result.expenses_by_category[0].change, 750.5);
});

test("percent change has no value without a baseline", () => {
  assert.equal(percentChange(500, 0), null);
  assert.equal(percentChange(750, 1000), -25);
});

test("a price increase reports the sales drop that cancels it out", () => {
  const result = simulatePriceChange(LEDGER, 25, TODAY);
  assert.equal(result.baseline.income, 4000);
  assert.equal(result.if_sales_volume_unchanged.income, 5000);
  assert.equal(result.if_sales_volume_unchanged.net_profit_change, 1000);
  assert.equal(result.break_even_volume_drop_pct, 20);
});

test("the monthly series ends with the current month and is labelled in the chosen language", () => {
  const series = monthlySeries(LEDGER, 3, TODAY, createTranslator("en"));
  assert.deepEqual(series.map((point) => point.label), ["Jan", "Feb", "Mar"]);
  assert.deepEqual(series.map((point) => point.net_profit), [0, 2500, 749.5]);
});

test("break-even is the first month cumulative profit covers the startup costs", () => {
  const forecast = buildForecast({
    startup_costs: [{ item: "Avadanlıq", amount: 3000 }],
    monthly_costs: [{ item: "İcarə", amount: 1000 }],
    monthly_revenue: [1500, 2000, 3000, 4000],
  });
  assert.equal(forecast.break_even_month, 3);
  assert.deepEqual(forecast.monthly_projection[0], { month: 1, revenue: 1500, costs: 1000 });
});

test("a plan that never recovers its costs has no break-even month", () => {
  const forecast = buildForecast({
    startup_costs: [{ item: "Avadanlıq", amount: 50000 }],
    monthly_costs: [{ item: "İcarə", amount: 2000 }],
    monthly_revenue: [1000, 1500, 2000],
  });
  assert.equal(forecast.break_even_month, null);
});
