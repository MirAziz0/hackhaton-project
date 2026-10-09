import { Rocket } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="bg-brand flex size-10 items-center justify-center rounded-full text-primary-foreground shadow-[0_6px_14px_-6px_rgb(109_61_245/0.7)]">
        <Rocket className="size-5" />
      </div>
      <span className={cn("text-xl font-semibold tracking-tight", dark ? "text-white" : "text-foreground")}>
        {APP_NAME}
      </span>
    </div>
  );
}
