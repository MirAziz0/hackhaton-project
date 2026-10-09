"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, Loader2, MessageCircle, Trash2, X } from "lucide-react";
import { useChat } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import type { Message } from "@/types/database";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/config";

interface Contact {
  id: string;
  full_name: string | null;
  track: string | null;
}

const MESSAGE_LIMIT = 300;
const DATE_LOCALES: Record<Locale, string> = { az: "az-AZ", en: "en-GB" };

function timeLabel(iso: string, locale: Locale) {
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(DATE_LOCALES[locale], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(DATE_LOCALES[locale], { day: "numeric", month: "short" });
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
  const t = useT();
  const locale = useLocale();
  const { currentUserId, open, setOpen, activeUserId, setActiveUserId } = useChat();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
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
    setDeleteError(false);
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

  // Removes the whole conversation with the open contact, for both participants.
  async function deleteChat() {
    if (!activeUserId || deleting) return;
    if (!window.confirm(t("Bu söhbət hər iki tərəf üçün silinəcək. Davam edilsin?"))) return;
    setDeleting(true);
    setSendError(false);
    const { data, error } = await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeUserId}),and(sender_id.eq.${activeUserId},receiver_id.eq.${currentUserId})`,
      )
      .select("id");
    setDeleting(false);
    // Row Level Security answers a forbidden delete with zero rows instead of an error.
    if (error || (thread.length > 0 && !data?.length)) {
      setDeleteError(true);
      return;
    }
    const removed = new Set((data as { id: string }[]).map((row) => row.id));
    setMessages((current) => current.filter((message) => !removed.has(message.id)));
    setActiveUserId(null);
  }

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
                <button type="button" onClick={() => setActiveUserId(null)} aria-label={t("Söhbətlərə qayıt")}>
                  <ArrowLeft className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{activeContact?.full_name || t("Sahibkar")}</p>
                  {activeContact?.track && (
                    <p className="truncate text-xs text-white/80">{t(trackLabel(activeContact.track))}</p>
                  )}
                </div>
                {thread.length > 0 && (
                  <button type="button" onClick={deleteChat} disabled={deleting} aria-label={t("Söhbəti sil")} title={t("Söhbəti sil")}>
                    {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </button>
                )}
              </>
            ) : (
              <span className="flex-1 text-sm font-semibold">{t("Mesajlar")}</span>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label={t("Bağla")}>
              <X className="size-4" />
            </button>
          </div>

          {activeUserId ? (
            <>
              <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
                {thread.length === 0 && (
                  <p className="pt-10 text-center text-sm text-muted-foreground">
                    {t("Söhbətə başlamaq üçün ilk mesajınızı yazın.")}
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
                          {timeLabel(message.created_at, locale)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {deleteError && (
                <p role="alert" className="px-3 pb-1 text-xs text-red-700">
                  {t("Söhbəti silmək mümkün olmadı. Yenidən cəhd edin.")}
                </p>
              )}
              {sendError && (
                <p role="alert" className="px-3 pb-1 text-xs text-red-700">
                  {t("Mesaj göndərilmədi. Yenidən cəhd edin.")}
                </p>
              )}
              <form onSubmit={send} className="flex gap-2 border-t p-3">
                <Input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("Mesaj yazın...")}
                  maxLength={2000}
                  aria-label={t("Mesaj")}
                />
                <Button type="submit" size="icon" className="shrink-0" disabled={sending || !draft.trim()} aria-label={t("Göndər")}>
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
              <p className="text-sm font-medium">{t("Hələ mesaj yoxdur")}</p>
              <p className="text-xs text-muted-foreground">
                {t("Şəbəkə bölməsində sahibkarın kartındakı “Əlaqə saxla” düyməsini basın.")}
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
                          {contacts[userId]?.full_name || t("Sahibkar")}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeLabel(last.created_at, locale)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
                          {last.sender_id === currentUserId ? `${t("Siz")}: ` : ""}
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
        aria-label={unreadTotal ? t("Mesajlar, {count} oxunmamış", { count: unreadTotal }) : t("Mesajlar")}
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
