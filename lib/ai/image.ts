import "server-only";

export interface GeneratedImage {
  data: Buffer;
  contentType: string;
}

type ImageShape = "square" | "wide";

// Single entry point for image generation so the provider can be swapped via IMAGE_PROVIDER.
// Returns null when no provider/key is configured or the request fails; callers fall back
// to placeholders, so the app keeps working without an image API.
export async function generateImage(prompt: string, shape: ImageShape = "square"): Promise<GeneratedImage | null> {
  const provider = (process.env.IMAGE_PROVIDER || "openai").toLowerCase();
  const apiKey = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    if (provider === "openai") return await generateWithOpenAI(prompt, shape, apiKey);
    // Add other providers here (same signature) and select them with IMAGE_PROVIDER.
    console.warn(`[image] Unknown IMAGE_PROVIDER "${provider}", using placeholders.`);
    return null;
  } catch (err) {
    console.error("[image] generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function generateWithOpenAI(prompt: string, shape: ImageShape, apiKey: string): Promise<GeneratedImage | null> {
  const model = process.env.IMAGE_MODEL || "gpt-image-1";
  const isDalle = model.startsWith("dall-e");

  const body = isDalle
    ? { model, prompt, n: 1, size: shape === "wide" ? "1792x1024" : "1024x1024", response_format: "b64_json" }
    : { model, prompt, n: 1, size: shape === "wide" ? "1536x1024" : "1024x1024", quality: "low" };

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(100_000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI images ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const json = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) return null;
  return { data: Buffer.from(b64, "base64"), contentType: "image/png" };
}
