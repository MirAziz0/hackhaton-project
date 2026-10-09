"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STUDIO_STEPS = [
  "İdeyanız və profiliniz təhlil edilir",
  "Biznes planı yazılır",
  "Maliyyə proqnozu hesablanır",
  "Uyğun məkanlar seçilir",
  "Brend adları və şüarlar hazırlanır",
];

interface GeneratingCardProps {
  title?: string;
  steps?: string[];
  hint?: string;
}

// Progress messages advance on a timer while a single long AI request is in flight.
export function GeneratingCard({
  title = "Planınız hazırlanır",
  steps = STUDIO_STEPS,
  hint = "Bu, adətən 20–40 saniyə çəkir.",
}: GeneratingCardProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => Math.min(current + 1, steps.length - 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-lg font-semibold">{title}</p>
          <ul className="space-y-3" aria-live="polite">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                {index < active ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="size-3" />
                  </span>
                ) : index === active ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <span className="size-5 rounded-full border-2 border-border" />
                )}
                <span className={index > active ? "text-muted-foreground" : "font-medium"}>{step}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-40 lg:col-span-2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-56 lg:col-span-3" />
      </div>
    </div>
  );
}
