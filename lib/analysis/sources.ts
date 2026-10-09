import type { AnalysisPayload, SourceReference } from "@/types/analysis";

// Marks a number quoted from the user's own plan rather than from an external source.
export const PLAN_SOURCE = "PLAN";
const SOURCE_ID_PATTERN = /\[([MW]\d+)\]/g;

// Last step of the Analysis agent. `references` holds every source the server numbered for
// the model. Citation markers for any other id are removed from all text, and only the
// references that are still cited are kept, so the report cannot point at a made-up source.
export function enforceSources(payload: AnalysisPayload, references: Map<string, SourceReference>): AnalysisPayload {
  const cleaned = JSON.parse(
    JSON.stringify(payload).replace(SOURCE_ID_PATTERN, (marker, id: string) => (references.has(id) ? marker : "")),
  ) as AnalysisPayload;

  const cited = new Set<string>();
  for (const match of JSON.stringify(cleaned).matchAll(SOURCE_ID_PATTERN)) cited.add(match[1]);
  for (const item of [...cleaned.sources.figures, ...cleaned.competitors]) if (item.source_id) cited.add(item.source_id);
  cited.delete(PLAN_SOURCE);

  cleaned.sources.references = [...references.values()].filter((reference) => cited.has(reference.id));
  return cleaned;
}
