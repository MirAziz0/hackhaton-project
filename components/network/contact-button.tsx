"use client";

import { MessageCircle } from "lucide-react";
import { useChat } from "@/components/chat/chat-provider";
import { Button, type ButtonProps } from "@/components/ui/button";

// Opens the floating chat widget on the thread with the given user.
export function ContactButton({ userId, ...props }: { userId: string } & Omit<ButtonProps, "onClick">) {
  const { openChatWith } = useChat();
  return (
    <Button onClick={() => openChatWith(userId)} {...props}>
      <MessageCircle />
      Əlaqə saxla
    </Button>
  );
}
