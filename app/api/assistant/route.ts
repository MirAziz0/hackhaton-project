import type OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ASSISTANT_TOOLS, executeTool } from "@/lib/ai/assistant-tools";
import { getAssistantLlmModel, getOpenAI } from "@/lib/ai/client";
import { AI_GENERIC_ERROR, toUserError } from "@/lib/ai/errors";
import { assistantSystemPrompt } from "@/lib/ai/prompts";
import { todayInBaku } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { AssistantEvent } from "@/types/assistant";
import type { Transaction } from "@/types/database";
import { getLocale, getT } from "@/lib/i18n/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Upper bound on model <-> tool round trips for one user message.
const MAX_TOOL_ROUNDS = 5;

const bodySchema = z.object({
  business_id: z.string().uuid(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20),
});

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;
interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
}

export async function POST(request: Request) {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: t("Davam etmək üçün daxil olun.") }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Sorğu düzgün deyil.") }, { status: 400 });
  const { business_id, messages: history } = parsed.data;

  // RLS guarantees the business and its transactions belong to the signed-in user.
  const [{ data: business }, { data: rows }] = await Promise.all([
    supabase.from("businesses").select("id, name").eq("id", business_id).maybeSingle(),
    supabase.from("transactions").select("*").eq("business_id", business_id).order("date", { ascending: true }),
  ]);
  if (!business) return NextResponse.json({ error: t("Biznes tapılmadı.") }, { status: 404 });

  const transactions = ((rows as Transaction[] | null) ?? []).map((tx) => ({ ...tx, amount: Number(tx.amount) }));
  const today = todayInBaku();

  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch (err) {
    const { message, status } = toUserError(err, t);
    return NextResponse.json({ error: message }, { status });
  }

  const model = getAssistantLlmModel();
  const conversation: Message[] = [
    {
      role: "system",
      content: assistantSystemPrompt({
        businessName: business.name as string,
        today,
        categories: [...new Set(transactions.map((tx) => tx.category))],
        locale: await getLocale(),
      }),
    },
    ...history.map((turn) => ({ role: turn.role, content: turn.content }) as Message),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AssistantEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const completion = await openai.chat.completions.create({
            model,
            messages: conversation,
            tools: ASSISTANT_TOOLS,
            stream: true,
            ...(/^(gpt-5|o\d)/.test(model) ? { reasoning_effort: "low" as const } : {}),
          });

          let text = "";
          const calls: PendingToolCall[] = [];

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;
            if (delta.content) {
              text += delta.content;
              send({ type: "text", delta: delta.content });
            }
            // Tool call arguments arrive in fragments, keyed by index.
            for (const part of delta.tool_calls ?? []) {
              const call = (calls[part.index] ??= { id: "", name: "", arguments: "" });
              if (part.id) call.id = part.id;
              if (part.function?.name) call.name = part.function.name;
              if (part.function?.arguments) call.arguments += part.function.arguments;
            }
          }

          const toolCalls = calls.filter(Boolean);
          if (!toolCalls.length) break; // final answer has been streamed

          conversation.push({
            role: "assistant",
            content: text || null,
            tool_calls: toolCalls.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: { name: call.name, arguments: call.arguments },
            })),
          });

          for (const call of toolCalls) {
            send({ type: "tool", name: call.name });
            const outcome = executeTool(call.name, call.arguments, { transactions, today, t });
            if (outcome.proposal) send({ type: "proposal", transaction: outcome.proposal });
            conversation.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(outcome.result) });
          }
        }
        send({ type: "done" });
      } catch (err) {
        const status = (err as { status?: number }).status;
        console.error("[assistant] failed:", status, err instanceof Error ? err.message : err);
        send({
          type: "error",
          message:
            status === 429
              ? t("AI xidmətinin limiti dolub və ya balans bitib. Bir az sonra yenidən cəhd edin.")
              : t(AI_GENERIC_ERROR),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
