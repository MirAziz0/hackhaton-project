"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

// Phase 1 shell: the conversation list and realtime thread arrive in Phase 5.
export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="flex items-center justify-between bg-sidebar px-4 py-3 text-white">
            <span className="text-sm font-semibold">Mesajlar</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Bağla">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
            <MessageCircle className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Hələ mesaj yoxdur</p>
            <p className="text-xs text-muted-foreground">
              Şəbəkə bölməsindən sahibkarlarla əlaqə saxlaya biləcəksiniz.
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Mesajlar"
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
