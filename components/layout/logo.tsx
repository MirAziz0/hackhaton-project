import { Rocket } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Rocket className="size-5" />
      </div>
      <span className={cn("text-lg font-semibold tracking-tight", dark ? "text-white" : "text-foreground")}>
        {APP_NAME}
      </span>
    </div>
  );
}
