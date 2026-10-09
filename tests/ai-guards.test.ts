import assert from "node:assert/strict";
import { test } from "node:test";
import { executeTool } from "@/lib/ai/assistant-tools";
import { enforceSources } from "@/lib/analysis/sources";
import { createTranslator } from "@/lib/i18n/translate";
import type { AnalysisPayload, SourceReference } from "@/types/analysis";

// What the code does with wrong model output: the model's reply is replaced by a hand-written
// bad answer, so these run without calling any AI service.

const context = { transactions: [], today: "2026-03-15", t: createTranslator("en") };

test("a made-up period comes back as an error that lists the valid ones", () => {
  const { result } = executeTool("get_summary", '{"period":"last_week"}', context);
  assert.match((result as { error: string }).error, /Unknown period "last_week".*this_month/);
});

test("broken tool arguments and unknown tools never throw", () => {
  assert.deepEqual(executeTool("get_summary", "{not json", context).result, { error: "Arguments were not valid JSON." });
  assert.match((executeTool("delete_everything", "{}", context).result as { error: string }).error, /Unknown tool/);
});

test("a parsed transaction is only proposed, dated today, and never saved by the tool", () => {
  const outcome = executeTool("add_transaction", '{"type":"income","amount":450.129,"category":"Sales"}', context);
  assert.deepEqual(outcome.proposal, { type: "income", amount: 450.13, category: "Sales", date: "2026-03-15", note: null });
  assert.equal((outcome.result as { status: string }).status, "awaiting_user_confirmation");
});

test("a negative or missing amount is rejected instead of becoming a transaction", () => {
  const outcome = executeTool("add_transaction", '{"type":"expense","amount":-50,"category":"Rent"}', context);
  assert.equal(outcome.proposal, undefined);
  assert.match((outcome.result as { error: string }).error, /Invalid transaction/);
});

function reference(id: string): SourceReference {
  return { id, kind: id.startsWith("M") ? "market_data" : "web", name: id, url: null, detail: "" };
}

test("citations the server never issued are removed, and unused sources are not listed", () => {
  const fit = { score: 70, reason: "Demand is growing [M1] and rents are falling [M9]." };
  const payload: AnalysisPayload = {
    overall_score: 70,
    market_fit: {
      summary: "A study says 80% of shoppers agree [W7].",
      baku: fit,
      regions: fit,
      online: fit,
      location_analysis: { assessment: "Fine.", alternatives: [] },
    },
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    budget_check: [],
    competitors: [{ name: "Shop", description: "d", differentiation: "x", source_id: null }],
    recommendations: [],
    sources: {
      figures: [
        { label: "Budget", value: "20 000", source_id: "PLAN" },
        { label: "Guess", value: "35%", source_id: null },
      ],
      references: [],
      web_search_used: true,
    },
  };
  const provided = new Map(["M1", "M2", "W1"].map((id) => [id, reference(id)]));

  const result = enforceSources(payload, provided);
  assert.equal(result.market_fit.baku.reason, "Demand is growing [M1] and rents are falling .");
  assert.equal(result.market_fit.summary, "A study says 80% of shoppers agree .");
  assert.deepEqual(result.sources.references.map((item) => item.id), ["M1"]);
});
