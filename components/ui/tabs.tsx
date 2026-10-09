"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn("flex w-fit max-w-full flex-wrap gap-1 rounded-[1.75rem] bg-card/80 p-1.5 shadow-card", className)}
    >
      {items.map(({ value: itemValue, label, icon: Icon }) => {
        const active = itemValue === value;
        return (
          <button
            key={itemValue}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(itemValue)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-brand text-primary-foreground shadow-[0_6px_14px_-6px_rgb(109_61_245/0.7)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
