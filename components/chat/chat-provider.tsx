"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ChatContextValue {
  currentUserId: string;
  open: boolean;
  // The user whose thread is shown, or null for the conversation list.
  activeUserId: string | null;
  setOpen: (open: boolean) => void;
  setActiveUserId: (userId: string | null) => void;
  // Opens the widget directly on the thread with the given user.
  openChatWith: (userId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ currentUserId, children }: { currentUserId: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const openChatWith = useCallback((userId: string) => {
    setActiveUserId(userId);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ currentUserId, open, activeUserId, setOpen, setActiveUserId, openChatWith }),
    [currentUserId, open, activeUserId, openChatWith],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}
