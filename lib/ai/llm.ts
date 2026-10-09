import "server-only";
import { z } from "zod";
import { getLlmModel, getOpenAI } from "@/lib/ai/client";
import { AI_GENERIC_ERROR, AiError } from "@/lib/ai/errors";

interface GenerateJsonOptions<T> {
  schema: z.ZodType<T>;
  system: string;
  user: string;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Reasoning models spend a long time thinking by default; keep them quick for the demo.
function reasoningOptions(model: string) {
  return /^(gpt-5|o\d)/.test(model) ? { reasoning_effort: "low" as const } : {};
}

async function complete(messages: ChatMessage[]) {
  const model = getLlmModel();
  const openai = getOpenAI(); // throws its own friendly error when the key is missing
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      ...reasoningOptions(model),
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (err) {
    const status = (err as { status?: number }).status;
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[ai] OpenAI request failed:", status, detail);
    if (status === 401) throw new AiError("OPENAI_API_KEY yanlışdır və ya etibarsızdır.", 503, detail);
    if (status === 404)
      throw new AiError(`"${model}" modeli tapılmadı. .env.local faylında LLM_MODEL dəyərini yoxlayın.`, 503, detail);
    if (status === 429)
      throw new AiError("AI xidmətinin limiti dolub və ya balans bitib. Bir az sonra yenidən cəhd edin.", 503, detail);
    throw new AiError(AI_GENERIC_ERROR, 502, detail);
  }
}

function parse<T>(schema: z.ZodType<T>, raw: string): { data: T } | { error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "The response was not valid JSON." };
  }
  const result = schema.safeParse(json);
  if (result.success) return { data: result.data };
  return { error: z.prettifyError(result.error) };
}

// Asks the model for strict JSON and validates it with Zod.
// On a validation failure it retries once, sending the validation error back to the model.
export async function generateJson<T>({ schema, system, user }: GenerateJsonOptions<T>): Promise<T> {
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const firstRaw = await complete(messages);
  const first = parse(schema, firstRaw);
  if ("data" in first) return first.data;

  console.warn("[ai] JSON validation failed, retrying once:", first.error);
  const secondRaw = await complete([
    ...messages,
    { role: "assistant", content: firstRaw },
    {
      role: "user",
      content: `Your JSON did not pass validation:\n${first.error}\n\nReturn the complete corrected JSON object only.`,
    },
  ]);
  const second = parse(schema, secondRaw);
  if ("data" in second) return second.data;

  throw new AiError(AI_GENERIC_ERROR, 502, `Validation failed twice: ${second.error}`);
}
