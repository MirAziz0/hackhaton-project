import { addMonths, lastDayOfMonth, monthKey, monthLabel, monthShortLabel, monthsBetween } from "@/lib/dates";
import { sourceText, type Translate } from "@/lib/i18n/translate";
import type { FinancialForecast, Transaction } from "@/types/database";

// All dashboard arithmetic lives here. The AI assistant calls these functions through tools
// and only explains the results; it never computes sums or percentages itself.

export interface Period {
  from: string;
  to: string;
  label: string;
}

export interface Summary {
  period: string;
  income: number;
  expenses: number;
  net_profit: number;
  margin_pct: number | null;
  transaction_count: number;
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

// Percentage change from `previous` to `current`; null when there is no baseline.
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export const PERIOD_KEYWORDS = ["this_month", "last_month", "last_3_months", "last_6_months", "this_year", "all"] as const;

// Accepts a keyword from PERIOD_KEYWORDS or a specific month as "YYYY-MM".
export function resolvePeriod(spec: string, today: string, t: Translate = sourceText): Period | null {
  const current = monthKey(today);
  const range = (fromKey: string, toKey: string, label: string): Period => ({
    from: `${fromKey}-01`,
    to: lastDayOfMonth(toKey),
    label,
  });

  switch (spec) {
    case "this_month":
      return range(current, current, monthLabel(current, t));
    case "last_month": {
      const previous = addMonths(current, -1);
      return range(previous, previous, monthLabel(previous, t));
    }
    case "last_3_months":
      return range(addMonths(current, -2), current, t("Son 3 ay"));
    case "last_6_months":
      return range(addMonths(current, -5), current, t("Son 6 ay"));
    case "this_year":
      return range(`${current.slice(0, 4)}-01`, `${current.slice(0, 4)}-12`, t("{year}-ci il", { year: current.slice(0, 4) }));
    case "all":
      return { from: "0000-01-01", to: "9999-12-31", label: t("Bütün dövr") };
    default:
      return /^\d{4}-(0[1-9]|1[0-2])$/.test(spec) ? range(spec, spec, monthLabel(spec, t)) : null;
  }
}

function inPeriod(transactions: Transaction[], period: Period) {
  return transactions.filter((tx) => tx.date >= period.from && tx.date <= period.to);
}

function total(transactions: Transaction[], type: Transaction["type"]) {
  return round2(transactions.filter((tx) => tx.type === type).reduce((sum, tx) => sum + Number(tx.amount), 0));
}

export function summarize(transactions: Transaction[], period: Period): Summary {
  const scoped = inPeriod(transactions, period);
  const income = total(scoped, "income");
  const expenses = total(scoped, "expense");
  const net = round2(income - expenses);
  return {
    period: period.label,
    income,
    expenses,
    net_profit: net,
    margin_pct: income > 0 ? Math.round((net / income) * 1000) / 10 : null,
    transaction_count: scoped.length,
  };
}

function byCategory(transactions: Transaction[], type: Transaction["type"]) {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === type) totals.set(tx.category, (totals.get(tx.category) ?? 0) + Number(tx.amount));
  }
  return totals;
}

export function categoryBreakdown(transactions: Transaction[], period: Period, type: Transaction["type"] = "expense") {
  const totals = byCategory(inPeriod(transactions, period), type);
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return {
    period: period.label,
    total: round2(sum),
    categories: [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount: round2(amount),
        share_pct: sum > 0 ? Math.round((amount / sum) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount),
  };
}

function categoryChanges(transactions: Transaction[], a: Period, b: Period, type: Transaction["type"]) {
  const first = byCategory(inPeriod(transactions, a), type);
  const second = byCategory(inPeriod(transactions, b), type);
  return [...new Set([...first.keys(), ...second.keys()])]
    .map((category) => {
      const amountA = round2(first.get(category) ?? 0);
      const amountB = round2(second.get(category) ?? 0);
      return {
        category,
        period_a: amountA,
        period_b: amountB,
        change: round2(amountA - amountB),
        change_pct: percentChange(amountA, amountB),
      };
    })
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
}

// Compares period A against period B (changes are "A minus B").
export function comparePeriods(transactions: Transaction[], a: Period, b: Period) {
  const summaryA = summarize(transactions, a);
  const summaryB = summarize(transactions, b);
  const change = (current: number, previous: number) => ({
    absolute: round2(current - previous),
    percent: percentChange(current, previous),
  });
  return {
    period_a: summaryA,
    period_b: summaryB,
    change_a_vs_b: {
      income: change(summaryA.income, summaryB.income),
      expenses: change(summaryA.expenses, summaryB.expenses),
      net_profit: change(summaryA.net_profit, summaryB.net_profit),
    },
    income_by_category: categoryChanges(transactions, a, b, "income"),
    expenses_by_category: categoryChanges(transactions, a, b, "expense"),
  };
}

export interface MonthPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net_profit: number;
}

// The last `count` calendar months ending with the current one.
export function monthlySeries(
  transactions: Transaction[],
  count: number,
  today: string,
  t: Translate = sourceText,
): MonthPoint[] {
  const current = monthKey(today);
  return Array.from({ length: count }, (_, index) => {
    const key = addMonths(current, index - (count - 1));
    const summary = summarize(transactions, resolvePeriod(key, today)!);
    return {
      month: key,
      label: monthShortLabel(key, t),
      income: summary.income,
      expenses: summary.expenses,
      net_profit: summary.net_profit,
    };
  });
}

// What-if: change prices by `percent`. Uses the last full month as the baseline (or the current
// month when the last one has no income). Costs are assumed unchanged.
export function simulatePriceChange(transactions: Transaction[], percent: number, today: string) {
  const lastMonth = summarize(transactions, resolvePeriod("last_month", today)!);
  const base = lastMonth.income > 0 ? lastMonth : summarize(transactions, resolvePeriod("this_month", today)!);
  const factor = 1 + percent / 100;

  const scenario = (volumeChangePct: number) => {
    const income = round2(base.income * factor * (1 + volumeChangePct / 100));
    const net = round2(income - base.expenses);
    return {
      sales_volume_change_pct: volumeChangePct,
      income,
      net_profit: net,
      net_profit_change: round2(net - base.net_profit),
    };
  };

  // For a price increase: the drop in sales volume at which income falls back to the baseline.
  const breakEvenVolumeDrop = percent > 0 ? Math.round((percent / (100 + percent)) * 1000) / 10 : null;

  return {
    baseline_period: base.period,
    price_change_pct: percent,
    baseline: { income: base.income, expenses: base.expenses, net_profit: base.net_profit },
    if_sales_volume_unchanged: scenario(0),
    volume_scenarios: (percent >= 0 ? [-5, -10, -20] : [5, 10, 20]).map(scenario),
    break_even_volume_drop_pct: breakEvenVolumeDrop,
    assumptions: "Costs stay the same as in the baseline month; only price and sales volume change.",
  };
}

// --- Dashboard KPIs and chart data -------------------------------------------------------

export function firstTransactionMonth(transactions: Transaction[]) {
  return transactions.length ? monthKey(transactions.reduce((min, tx) => (tx.date < min ? tx.date : min), transactions[0].date)) : null;
}

// Plan month N is the Nth calendar month counted from the first transaction.
export function forecastVsActual(
  transactions: Transaction[],
  forecast: FinancialForecast | null,
  today: string,
  t: Translate = sourceText,
) {
  const start = firstTransactionMonth(transactions);
  if (!forecast?.monthly_projection?.length || !start) return [];
  const elapsed = monthsBetween(start, monthKey(today));

  return forecast.monthly_projection.map((planned, index) => {
    const key = addMonths(start, index);
    return {
      month: key,
      label: monthShortLabel(key, t),
      forecast: planned.revenue,
      // Future months have no actual value yet.
      actual: index <= elapsed ? summarize(transactions, resolvePeriod(key, today)!).income : null,
    };
  });
}

export function computeKpis(transactions: Transaction[], forecast: FinancialForecast | null, today: string) {
  const current = summarize(transactions, resolvePeriod("this_month", today)!);
  const previous = summarize(transactions, resolvePeriod("last_month", today)!);
  const planned = forecastVsActual(transactions, forecast, today).find((point) => point.month === monthKey(today));

  return {
    current,
    previous,
    change: {
      income: percentChange(current.income, previous.income),
      expenses: percentChange(current.expenses, previous.expenses),
      net_profit: percentChange(current.net_profit, previous.net_profit),
    },
    forecast: planned
      ? {
          target: planned.forecast,
          actual: current.income,
          progress_pct: planned.forecast > 0 ? Math.round((current.income / planned.forecast) * 100) : 0,
        }
      : null,
  };
}
