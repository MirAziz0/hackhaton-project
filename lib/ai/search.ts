import "server-only";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

// Single entry point for web search so the provider can be swapped via SEARCH_PROVIDER.
// Returns an empty list when no key is set or the request fails, so the app continues without it.
export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  const provider = (process.env.SEARCH_PROVIDER || "tavily").toLowerCase();
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) return [];

  try {
    if (provider === "tavily") return await searchWithTavily(query, maxResults, apiKey);
    // Add other providers here (same signature) and select them with SEARCH_PROVIDER.
    console.warn(`[search] Unknown SEARCH_PROVIDER "${provider}", skipping web search.`);
    return [];
  } catch (err) {
    console.error("[search] failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function searchWithTavily(query: string, maxResults: number, apiKey: string): Promise<SearchResult[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query, max_results: maxResults, search_depth: "basic" }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Tavily ${response.status}: ${(await response.text()).slice(0, 200)}`);

  const json = (await response.json()) as { results?: { title?: string; url?: string; content?: string }[] };
  return (json.results ?? [])
    .filter((result) => result.url && /^https?:\/\//.test(result.url))
    .map((result) => ({
      title: result.title ?? result.url!,
      url: result.url!,
      content: (result.content ?? "").slice(0, 500),
    }));
}
