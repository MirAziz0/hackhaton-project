import "server-only";

export interface GeneratedImage {
  data: Buffer;
  contentType: string;
}

type ImageShape = "square" | "wide";

const TIMEOUT_MS = 100_000;

// Single entry point for image generation so the provider can be swapped via IMAGE_PROVIDER
// ("openai" by default, or "gemini"). Returns null when no key is configured or the request fails;
// callers fall back to placeholders, so the app keeps working without an image API.
export async function generateImage(prompt: string, shape: ImageShape = "square"): Promise<GeneratedImage | null> {
  const provider = (process.env.IMAGE_PROVIDER || "openai").toLowerCase();

  try {
    if (provider === "gemini") {
      const apiKey = process.env.IMAGE_API_KEY || process.env.GEMINI_API_KEY;
      return apiKey ? await generateWithGemini(prompt, shape, apiKey) : null;
    }
    if (provider === "openai") {
      const apiKey = process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY;
      return apiKey ? await generateWithOpenAI(prompt, shape, apiKey) : null;
    }
    console.warn(`[image] Unknown IMAGE_PROVIDER "${provider}", using placeholders.`);
    return null;
  } catch (err) {
    console.error(`[image] ${provider} generation failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
}

async function generateWithGemini(prompt: string, shape: ImageShape, apiKey: string): Promise<GeneratedImage | null> {
  const model = process.env.IMAGE_MODEL || "gemini-2.5-flash-image";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: shape === "wide" ? "16:9" : "1:1" },
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const json = (await response.json()) as GeminiResponse;
  const inline = json.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!inline?.data) return null;
  return { data: Buffer.from(inline.data, "base64"), contentType: inline.mimeType || "image/png" };
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenAI images ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const json = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) return null;
  return { data: Buffer.from(b64, "base64"), contentType: "image/png" };
}
