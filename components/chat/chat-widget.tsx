"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, Loader2, MessageCircle, X } from "lucide-react";
import { useChat } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import type { Message } from "@/types/database";

interface Contact {
  id: string;
  full_name: string | null;
  track: string | null;
}

const MESSAGE_LIMIT = 300;

function timeLabel(iso: string) {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

function Avatar({ name, className }: { name: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

// Floating user-to-user chat: conversation list, unread badge, thread and realtime updates.
export function ChatWidget() {
  const { currentUserId, open, setOpen, activeUserId, setActiveUserId } = useChat();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const requested = useRef(new Set<string>());
  const scroller = useRef<HTMLDivElement>(null);

  const otherOf = useCallback(
    (message: Message) => (message.sender_id === currentUserId ? message.receiver_id : message.sender_id),
    [currentUserId],
  );

  // Loads names for people we have not seen yet (each id is requested once).
  const loadContacts = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => id !== currentUserId && !requested.current.has(id));
      if (!missing.length) return;
      missing.forEach((id) => requested.current.add(id));
      const { data } = await supabase.from("profiles").select("id, full_name, track").in("id", missing);
      if (data?.length) {
        setContacts((current) => ({ ...current, ...Object.fromEntries((data as Contact[]).map((c) => [c.id, c])) }));
      }
    },
    [supabase, currentUserId],
  );

  const addMessage = useCallback((message: Message) => {
    setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
  }, []);

  // Initial load + realtime subscription for messages sent to this user.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_LIMIT);
      if (cancelled) return;
      const loaded = ((data as Message[] | null) ?? []).reverse();
      setMessages(loaded);
      setLoading(false);
      void loadContacts([...new Set(loaded.map(otherOf))]);
    })();

    const channel = supabase
      .channel(`messages-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${currentUserId}` },
        (payload) => {
          const message = payload.new as Message;
          addMessage(message);
          void loadContacts([message.sender_id]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, otherOf, loadContacts, addMessage]);

  // Make sure the person opened from a network card or profile has a name to show.
  useEffect(() => {
    if (activeUserId) void loadContacts([activeUserId]);
  }, [activeUserId, loadContacts]);

  const conversations = useMemo(() => {
    const byUser = new Map<string, { last: Message; unread: number }>();
    for (const message of messages) {
      const other = otherOf(message);
      const entry = byUser.get(other) ?? { last: message, unread: 0 };
      entry.last = message;
      if (message.receiver_id === currentUserId && !message.read) entry.unread += 1;
      byUser.set(other, entry);
    }
    return [...byUser.entries()]
      .map(([userId, entry]) => ({ userId, ...entry }))
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [messages, currentUserId, otherOf]);

  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unread, 0);
  const thread = useMemo(
    () => (activeUserId ? messages.filter((message) => otherOf(message) === activeUserId) : []),
    [messages, activeUserId, otherOf],
  );
  const unreadInThread = thread.some((message) => message.receiver_id === currentUserId && !message.read);

  // Mark the open thread as read (also when a new message arrives while it is open).
  useEffect(() => {
    if (!open || !activeUserId || !unreadInThread) return;
    setMessages((current) =>
      current.map((message) =>
        message.sender_id === activeUserId && message.receiver_id === currentUserId ? { ...message, read: true } : message,
      ),
    );
    void supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", activeUserId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);
  }, [open, activeUserId, unreadInThread, supabase, currentUserId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [thread.length, activeUserId, open]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeUserId || sending) return;
    setSending(true);
    setSendError(false);
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: currentUserId, receiver_id: activeUserId, content })
      .select("*")
      .single();
    if (error || !data) setSendError(true);
    else {
      addMessage(data as Message);
      setDraft("");
    }
    setSending(false);
  }

  const activeContact = activeUserId ? contacts[activeUserId] : null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[30rem] max-h-[calc(100vh-8rem)] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="bg-brand flex items-center gap-2 px-4 py-3 text-white">
            {activeUserId ? (
              <>
                <button type="button" onClick={() => setActiveUserId(null)} aria-label="Söhbətlərə qayıt">
                  <ArrowLeft className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{activeContact?.full_name || "Sahibkar"}</p>
                  {activeContact?.track && (
                    <p className="truncate text-xs text-white/80">{trackLabel(activeContact.track)}</p>
                  )}
                </div>
              </>
            ) : (
              <span className="flex-1 text-sm font-semibold">Mesajlar</span>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label="Bağla">
              <X className="size-4" />
            </button>
          </div>

          {activeUserId ? (
            <>
              <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
                {thread.length === 0 && (
                  <p className="pt-10 text-center text-sm text-muted-foreground">
                    Söhbətə başlamaq üçün ilk mesajınızı yazın.
                  </p>
                )}
                {thread.map((message) => {
                  const mine = message.sender_id === currentUserId;
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                          mine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={cn("mt-1 text-right text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
                          {timeLabel(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {sendError && (
                <p role="alert" className="px-3 pb-1 text-xs text-red-700">
                  Mesaj göndərilmədi. Yenidən cəhd edin.
                </p>
              )}
              <form onSubmit={send} className="flex gap-2 border-t p-3">
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Mesaj yazın..."
                  maxLength={2000}
                  aria-label="Mesaj"
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={sending || !draft.trim()} aria-label="Göndər">
                  {sending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                </Button>
              </form>
            </>
          ) : loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <MessageCircle className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Hələ mesaj yoxdur</p>
              <p className="text-xs text-muted-foreground">
                Şəbəkə bölməsində sahibkarın kartındakı “Əlaqə saxla” düyməsini basın.
              </p>
            </div>
          ) : (
            <ul className="flex-1 divide-y overflow-y-auto">
              {conversations.map(({ userId, last, unread }) => (
                <li key={userId}>
                  <button
                    type="button"
                    onClick={() => setActiveUserId(userId)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <Avatar name={contacts[userId]?.full_name ?? null} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
                          {contacts[userId]?.full_name || "Sahibkar"}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeLabel(last.created_at)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
                          {last.sender_id === currentUserId ? "Siz: " : ""}
                          {last.content}
                        </span>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={unreadTotal ? `Mesajlar, ${unreadTotal} oxunmamış` : "Mesajlar"}
        className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-red-600 px-1 text-xs font-semibold text-white">
            {unreadTotal}
          </span>
        )}
      </button>
    </div>
  );
}
