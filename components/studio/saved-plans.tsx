/* eslint-disable @next/next/no-img-element -- logos come from Supabase Storage or data URIs */
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { initials } from "@/lib/utils";
import type { Business } from "@/types/database";

interface SavedPlansProps {
  businesses: Business[];
  onOpen: (business: Business) => void;
}

export function SavedPlans({ businesses, onOpen }: SavedPlansProps) {
  if (!businesses.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Saxlanmış planlar</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => {
          const logo = business.branding?.logo_urls?.[0];
          return (
            <button
              key={business.id}
              type="button"
              onClick={() => onOpen(business)}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {logo ? (
                <img src={logo} alt="" className="size-12 shrink-0 rounded-lg border bg-white object-contain" />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary font-semibold text-primary">
                  {initials(business.name)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{business.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatDate(business.created_at)}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
