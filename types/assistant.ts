import type { TransactionType } from "@/types/database";

// A transaction the assistant parsed from natural language. It is only saved after the
// user confirms it on the "Əlavə edilsin?" card.
export interface TransactionProposal {
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note: string | null;
}

// Newline-delimited JSON events streamed from /api/assistant.
export type AssistantEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string }
  | { type: "proposal"; transaction: TransactionProposal }
  | { type: "error"; message: string }
  | { type: "done" };

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}
