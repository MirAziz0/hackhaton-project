import "server-only";
import OpenAI from "openai";
import { AiError } from "@/lib/ai/errors";

let client: OpenAI | null = null;

export function getLlmModel() {
  return process.env.LLM_MODEL || "gpt-4.1";
}

// Smaller, quicker model for short tasks where speed matters more than depth (clarifying
// questions, ranking matches). Falls back to the main model when LLM_FAST_MODEL is not set.
export function getFastLlmModel() {
  return process.env.LLM_FAST_MODEL || getLlmModel();
}

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "AI açarı konfiqurasiya edilməyib. .env.local faylına OPENAI_API_KEY əlavə edin və serveri yenidən başladın.",
      503,
    );
  }
  client ??= new OpenAI({ apiKey, timeout: 110_000, maxRetries: 1 });
  return client;
}
