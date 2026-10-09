import "server-only";
import type OpenAI from "openai";
import { z } from "zod";
import {
  categoryBreakdown,
  comparePeriods,
  monthlySeries,
  resolvePeriod,
  simulatePriceChange,
  summarize,
} from "@/lib/finance/dashboard";
import type { Translate } from "@/lib/i18n/translate";
import type { TransactionProposal } from "@/types/assistant";
import type { Transaction } from "@/types/database";

const PERIOD_DESCRIPTION =
  "One of: this_month, last_month, last_3_months, last_6_months, this_year, all, or a specific month as YYYY-MM.";

const period = { type: "string", description: PERIOD_DESCRIPTION };

// Tool definitions sent to the model. The model picks a tool; the functions below compute.
export const ASSISTANT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_summary",
      description: "Total income, expenses, net profit and margin for a period.",
      parameters: { type: "object", properties: { period }, required: ["period"], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_expenses_by_category",
      description: "Expenses for a period grouped by category, largest first, with each category's share.",
      parameters: { type: "object", properties: { period }, required: ["period"], additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_periods",
      description:
        "Compares period A against period B: income, expenses and net profit changes (A minus B) plus the change in every income and expense category. Use it to explain why profit rose or fell.",
      parameters: {
        type: "object",
        properties: { period_a: period, period_b: period },
        required: ["period_a", "period_b"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_trend",
      description: "Income, expenses and net profit for each of the last N calendar months (including the current one).",
      parameters: {
        type: "object",
        properties: { months: { type: "integer", minimum: 2, maximum: 12 } },
        required: ["months"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "simulate_price_change",
      description:
        "What-if scenario: effect on income and net profit of changing prices by a percentage (positive = increase), including scenarios where sales volume changes.",
      parameters: {
        type: "object",
        properties: { percent: { type: "number", minimum: -90, maximum: 300 } },
        required: ["percent"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_transaction",
      description:
        "Prepares a new income or expense transaction for the user to confirm. It is NOT saved until the user confirms it in the interface.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number", description: "Positive amount in AZN." },
          category: { type: "string", description: "Short category name in the user's language." },
          date: { type: "string", description: "YYYY-MM-DD. Omit to use today." },
          note: { type: "string", description: "Optional short note in the user's language." },
        },
        required: ["type", "amount", "category"],
        additionalProperties: false,
      },
    },
  },
];

const periodArgs = z.object({ period: z.string() });
const compareArgs = z.object({ period_a: z.string(), period_b: z.string() });
const trendArgs = z.object({ months: z.number().int().min(2).max(12) });
const priceArgs = z.object({ percent: z.number().min(-90).max(300) });
const transactionArgs = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive().max(100_000_000),
  category: z.string().trim().min(1).max(60),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().trim().max(200).optional(),
});

interface ToolContext {
  transactions: Transaction[];
  today: string;
  // Translates period and month labels, which the model repeats in its answer.
  t: Translate;
}

export interface ToolOutcome {
  // JSON-serialisable result handed back to the model.
  result: unknown;
  // Set when the tool produced a transaction for the user to confirm.
  proposal?: TransactionProposal;
}

function badPeriod(value: string) {
  return { error: `Unknown period "${value}". ${PERIOD_DESCRIPTION}` };
}

// Runs one tool call. Invalid arguments come back as an error object so the model can correct itself.
export function executeTool(name: string, rawArgs: string, context: ToolContext): ToolOutcome {
  let args: unknown;
  try {
    args = JSON.parse(rawArgs || "{}");
  } catch {
    return { result: { error: "Arguments were not valid JSON." } };
  }
  const { transactions, today, t } = context;

  switch (name) {
    case "get_summary": {
      const parsed = periodArgs.safeParse(args);
      if (!parsed.success) return { result: { error: "Missing 'period'." } };
      const resolved = resolvePeriod(parsed.data.period, today, t);
      return { result: resolved ? summarize(transactions, resolved) : badPeriod(parsed.data.period) };
    }
    case "get_expenses_by_category": {
      const parsed = periodArgs.safeParse(args);
      if (!parsed.success) return { result: { error: "Missing 'period'." } };
      const resolved = resolvePeriod(parsed.data.period, today, t);
      return { result: resolved ? categoryBreakdown(transactions, resolved) : badPeriod(parsed.data.period) };
    }
    case "compare_periods": {
      const parsed = compareArgs.safeParse(args);
      if (!parsed.success) return { result: { error: "Missing 'period_a' or 'period_b'." } };
      const a = resolvePeriod(parsed.data.period_a, today, t);
      const b = resolvePeriod(parsed.data.period_b, today, t);
      if (!a) return { result: badPeriod(parsed.data.period_a) };
      if (!b) return { result: badPeriod(parsed.data.period_b) };
      return { result: comparePeriods(transactions, a, b) };
    }
    case "get_monthly_trend": {
      const parsed = trendArgs.safeParse(args);
      if (!parsed.success) return { result: { error: "'months' must be an integer from 2 to 12." } };
      return { result: monthlySeries(transactions, parsed.data.months, today, t) };
    }
    case "simulate_price_change": {
      const parsed = priceArgs.safeParse(args);
      if (!parsed.success) return { result: { error: "'percent' must be a number between -90 and 300." } };
      return { result: simulatePriceChange(transactions, parsed.data.percent, today) };
    }
    case "add_transaction": {
      const parsed = transactionArgs.safeParse(args);
      if (!parsed.success) {
        return { result: { error: "Invalid transaction. Need type (income|expense), a positive amount and a category." } };
      }
      const proposal: TransactionProposal = {
        type: parsed.data.type,
        amount: Math.round(parsed.data.amount * 100) / 100,
        category: parsed.data.category,
        date: parsed.data.date ?? today,
        note: parsed.data.note || null,
      };
      return {
        proposal,
        result: { status: "awaiting_user_confirmation", transaction: proposal },
      };
    }
    default:
      return { result: { error: `Unknown tool "${name}".` } };
  }
}
