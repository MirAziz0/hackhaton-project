import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function OptionCard({ label, description, icon: Icon, selected, onClick, compact }: OptionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border bg-card text-left transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "px-4 py-3" : "p-4",
        selected && "border-primary bg-secondary ring-1 ring-primary",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
      {selected && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}
