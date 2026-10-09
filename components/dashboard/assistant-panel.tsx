"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/dates";
import { cn, formatAZN } from "@/lib/utils";
import type { AssistantEvent, ChatTurn, TransactionProposal } from "@/types/assistant";

type ProposalStatus = "pending" | "saving" | "confirmed" | "cancelled" | "error";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
  proposal?: { transaction: TransactionProposal; status: ProposalStatus };
  error?: boolean;
}

const SUGGESTIONS = [
  "Bu gün 450 manat satış oldu",
  "Bu ay ən çox nəyə xərclədim?",
  "Mənfəətim niyə azaldı?",
  "Qiyməti 10% artırsam nə olar?",
];

const TOOL_LABELS: Record<string, string> = {
  get_summary: "Gəlir və xərclər hesablanır",
  get_expenses_by_category: "Xərclər kateqoriyalar üzrə hesablanır",
  compare_periods: "Dövrlər müqayisə edilir",
  get_monthly_trend: "Aylıq dinamika hesablanır",
  simulate_price_change: "Ssenari hesablanır",
  add_transaction: "Əməliyyat hazırlanır",
};

const GENERIC_ERROR = "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";
const HISTORY_LIMIT = 12;

interface AssistantPanelProps {
  businessId: string;
  onConfirmTransaction: (proposal: TransactionProposal) => Promise<void>;
}

export function AssistantPanel({ businessId, onConfirmTransaction }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function patch(id: number, update: (message: Message) => Message) {
    setMessages((current) => current.map((message) => (message.id === id ? update(message) : message)));
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    const history: ChatTurn[] = messages
      .filter((message) => message.content.trim() && !message.error)
      .slice(-HISTORY_LIMIT)
      .map((message) => ({ role: message.role, content: message.content }));

    const userId = nextId.current++;
    const replyId = nextId.current++;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: question },
      { id: replyId, role: "assistant", content: "", tool: null },
    ]);
    setDraft("");
    setBusy(true);

    const handle = (event: AssistantEvent) => {
      if (event.type === "text") patch(replyId, (m) => ({ ...m, content: m.content + event.delta, tool: null }));
      else if (event.type === "tool") patch(replyId, (m) => ({ ...m, tool: event.name }));
      else if (event.type === "proposal")
        patch(replyId, (m) => ({ ...m, proposal: { transaction: event.transaction, status: "pending" } }));
      else if (event.type === "error") patch(replyId, (m) => ({ ...m, content: event.message, error: true, tool: null }));
    };

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, messages: [...history, { role: "user", content: question }] }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? GENERIC_ERROR);
      }

      // The reply is newline-delimited JSON; a chunk can end in the middle of a line.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handle(JSON.parse(line) as AssistantEvent);
      }
      if (buffer.trim()) handle(JSON.parse(buffer) as AssistantEvent);
      patch(replyId, (m) => ({ ...m, tool: null }));
    } catch (err) {
      patch(replyId, (m) => ({
        ...m,
        content: err instanceof Error && err.message !== "Failed to fetch" ? err.message : GENERIC_ERROR,
        error: true,
        tool: null,
      }));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(message: Message) {
    if (!message.proposal) return;
    const { transaction } = message.proposal;
    patch(message.id, (m) => ({ ...m, proposal: { transaction, status: "saving" } }));
    try {
      await onConfirmTransaction(transaction);
      patch(message.id, (m) => ({ ...m, proposal: { transaction, status: "confirmed" } }));
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          content: `Əlavə edildi: ${transaction.category}, ${formatAZN(transaction.amount)} (${transaction.type === "income" ? "gəlir" : "xərc"}). Qrafiklər yeniləndi.`,
        },
      ]);
    } catch {
      patch(message.id, (m) => ({ ...m, proposal: { transaction, status: "error" } }));
    }
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">AI köməkçi</p>
          <p className="text-xs text-muted-foreground">Əməliyyat əlavə edin və ya sual verin</p>
        </div>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Salam! Satış və xərclərinizi sadə dillə yazın, mən onları qeyd edim. Maliyyəniz haqqında sual da verə bilərsiniz.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-lg border bg-muted/40 px-3 py-2 text-left text-sm transition-colors hover:border-primary/50 hover:bg-secondary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {message.content}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-2">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 max-w-[88%] space-y-2">
                {message.tool && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    {TOOL_LABELS[message.tool] ?? "Hesablanır"}…
                  </p>
                )}
                {message.content ? (
                  <p
                    className={cn(
                      "whitespace-pre-wrap rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm",
                      message.error ? "bg-red-50 text-red-700" : "bg-muted",
                    )}
                  >
                    {message.content}
                  </p>
                ) : (
                  !message.tool && !message.proposal && <TypingDots />
                )}
                {message.proposal && (
                  <ProposalCard
                    transaction={message.proposal.transaction}
                    status={message.proposal.status}
                    onConfirm={() => void confirm(message)}
                    onCancel={() =>
                      patch(message.id, (m) => ({
                        ...m,
                        proposal: { transaction: m.proposal!.transaction, status: "cancelled" },
                      }))
                    }
                  />
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
        className="flex gap-2 border-t p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Məsələn: Bu gün 450 manat satış oldu"
          maxLength={2000}
          aria-label="AI köməkçiyə mesaj"
        />
        <Button type="submit" size="icon" className="shrink-0" disabled={busy || !draft.trim()} aria-label="Göndər">
          {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
        </Button>
      </form>
    </aside>
  );
}

function TypingDots() {
  return (
    <p className="flex w-fit gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3" aria-label="Yazır">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </p>
  );
}

interface ProposalCardProps {
  transaction: TransactionProposal;
  status: ProposalStatus;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation card: nothing is saved until the user presses "Təsdiqlə".
function ProposalCard({ transaction, status, onConfirm, onCancel }: ProposalCardProps) {
  const open = status === "pending" || status === "saving" || status === "error";

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {status === "confirmed" ? "Əlavə edildi" : status === "cancelled" ? "Ləğv edildi" : "Əlavə edilsin?"}
      </p>
      <dl className="mt-2 space-y-1 text-sm">
        <Row label="Növ" value={transaction.type === "income" ? "Gəlir" : "Xərc"} />
        <Row label="Məbləğ" value={formatAZN(transaction.amount)} strong />
        <Row label="Kateqoriya" value={transaction.category} />
        <Row label="Tarix" value={formatDate(transaction.date)} />
        {transaction.note && <Row label="Qeyd" value={transaction.note} />}
      </dl>

      {status === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          Yadda saxlamaq mümkün olmadı. Yenidən cəhd edin.
        </p>
      )}

      {open ? (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={onConfirm} disabled={status === "saving"}>
            {status === "saving" ? <Loader2 className="animate-spin" /> : <Check />}
            Təsdiqlə
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={status === "saving"}>
            <X />
            Ləğv et
          </Button>
        </div>
      ) : (
        status === "confirmed" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Check className="size-3.5" />
            Əməliyyat yadda saxlanıldı
          </p>
        )
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}
