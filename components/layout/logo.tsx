/* eslint-disable @next/next/no-img-element -- small static logo; no image optimisation needed */
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

// The emblem cropped from the brand artwork (public/logo-mark.png).
export function LogoMark({ className }: { className?: string }) {
  return <img src="/logo-mark.png" alt="" width={40} height={40} className={cn("size-10 shrink-0", className)} />;
}

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-xl font-semibold tracking-tight", dark ? "text-white" : "text-foreground")}>
        {APP_NAME}
      </span>
    </div>
  );
}
