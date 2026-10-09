"use client";

import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "ENG", az: "AZ" };

// ENG / AZ toggle. The choice is kept in a cookie so server-rendered pages and the AI routes
// use the same language; "dark" is for the landing and sign-in pages.
export function LanguageSwitch({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();
  const dark = variant === "dark";

  function select(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={t("Dil")}
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full p-1 text-xs font-semibold",
        dark ? "border border-white/10 bg-white/5" : "glass-light",
        className,
      )}
    >
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          aria-pressed={locale === item}
          onClick={() => select(item)}
          className={cn(
            "rounded-full px-2.5 py-1.5 transition-colors",
            locale === item
              ? dark
                ? "bg-white/15 text-white"
                : "bg-brand text-white"
              : dark
                ? "text-white/70 hover:text-white"
                : "text-foreground/75 hover:text-foreground",
          )}
        >
          {LABELS[item]}
        </button>
      ))}
    </div>
  );
}
