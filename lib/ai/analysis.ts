import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateJson } from "@/lib/ai/llm";
import { ANALYSIS_SYSTEM, analysisUserPrompt } from "@/lib/ai/prompts";
import { analysisSchema } from "@/lib/ai/schemas";
import { webSearch } from "@/lib/ai/search";
import { trackLabel } from "@/lib/constants";
import type { AnalysisPayload, SourceReference } from "@/types/analysis";
import type { MarketData, Profile } from "@/types/database";

const SECTORS_WITH_DATA = ["cosmetics", "food", "clothing", "it_services"];
const PLAN_SOURCE = "PLAN";
const REGION_LABELS: Record<string, string> = { baku: "Bakı", regions: "Regionlar", online: "Onlayn" };
const SOURCE_ID_PATTERN = /\[([MW]\d+)\]/g;

interface AnalysisInput {
  supabase: SupabaseClient;
  profile: Profile;
  businessName: string;
  planText: string;
  // Sector of the plan being analysed; it can differ from the user's own profile track.
  sector: string | null;
}

function formatValue(row: MarketData) {
  return [row.value, row.unit, row.year ? `(${row.year})` : ""].filter(Boolean).join(" ");
}

// Analysis agent: plan text + market_data rows + web search results -> validated analysis.
// Every source the model may cite is numbered here, and the ids it returns are checked in code,
// so a figure can only be shown as "sourced" when it points at a row we actually provided.
export async function runAnalysis(input: AnalysisInput): Promise<AnalysisPayload> {
  const { supabase, profile, businessName, planText } = input;
  const sector = input.sector && SECTORS_WITH_DATA.includes(input.sector) ? input.sector : null;
  const sectorLabel = input.sector ? trackLabel(input.sector) : "not specified";

  const [marketResult, webResults] = await Promise.all([
    sector
      ? supabase.from("market_data").select("*").eq("sector", sector).order("region")
      : Promise.resolve({ data: [] as MarketData[] }),
    webSearch(`${businessName} ${sectorLabel} ${profile.city ?? "Bakı"} Azərbaycan rəqiblər bazar`),
  ]);
  const marketRows = (marketResult.data as MarketData[] | null) ?? [];

  const references = new Map<string, SourceReference>();
  const marketById = new Map<string, MarketData>();

  const marketLines = marketRows.map((row, index) => {
    const id = `M${index + 1}`;
    const region = REGION_LABELS[row.region] ?? row.region;
    marketById.set(id, row);
    references.set(id, {
      id,
      kind: "market_data",
      name: row.source_name ?? "Bazar məlumatı",
      url: row.source_url,
      detail: `${row.metric} (${region}): ${formatValue(row)}`,
    });
    return `[${id}] region=${region} | ${row.metric}: ${formatValue(row)}`;
  });

  const webLines = webResults.map((result, index) => {
    const id = `W${index + 1}`;
    references.set(id, { id, kind: "web", name: result.title, url: result.url, detail: result.content.slice(0, 200) });
    return `[${id}] ${result.title} (${result.url})\n${result.content}`;
  });

  const output = await generateJson({
    schema: analysisSchema,
    system: ANALYSIS_SYSTEM,
    user: analysisUserPrompt({ profile, planText, sectorLabel, marketData: marketLines, webResults: webLines }),
  });

  const validId = (id: string | null | undefined) => (id && references.has(id) ? id : null);

  const figures = output.key_figures.map((figure) => {
    // "PLAN" marks a number quoted from the user's own plan rather than from an external source.
    const source_id = figure.source_id === PLAN_SOURCE ? PLAN_SOURCE : validId(figure.source_id);
    const row = source_id ? marketById.get(source_id) : undefined;
    // For market data the displayed value is taken from the database row, not from the model.
    return { label: figure.label, value: row ? formatValue(row) : figure.value, source_id };
  });

  const competitors = output.competitors
    .filter((competitor) => competitor.name?.trim())
    .slice(0, 6)
    .map((competitor) => ({
      ...competitor,
      name: competitor.name!.trim(),
      source_id: validId(competitor.source_id),
    }));

  const payload: AnalysisPayload = {
    overall_score: Math.round(output.overall_score),
    market_fit: {
      summary: output.summary,
      baku: { ...output.market_fit.baku, score: Math.round(output.market_fit.baku.score) },
      regions: { ...output.market_fit.regions, score: Math.round(output.market_fit.regions.score) },
      online: { ...output.market_fit.online, score: Math.round(output.market_fit.online.score) },
      location_analysis: output.location_analysis,
    },
    swot: output.swot,
    budget_check: output.budget_check,
    competitors,
    recommendations: output.recommendations,
    sources: { figures, references: [], web_search_used: webResults.length > 0 },
  };

  // Keep only the references that are actually cited, and drop citation markers for unknown ids.
  const cleaned = JSON.parse(
    JSON.stringify(payload).replace(SOURCE_ID_PATTERN, (marker, id: string) => (references.has(id) ? marker : "")),
  ) as AnalysisPayload;

  const cited = new Set<string>();
  for (const match of JSON.stringify(cleaned).matchAll(SOURCE_ID_PATTERN)) cited.add(match[1]);
  for (const item of [...figures, ...competitors]) if (item.source_id) cited.add(item.source_id);
  cited.delete(PLAN_SOURCE);

  cleaned.sources.references = [...references.values()].filter((reference) => cited.has(reference.id));
  return cleaned;
}
