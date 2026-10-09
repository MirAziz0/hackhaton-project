"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAZN } from "@/lib/utils";
import type { LocationSuggestion } from "@/types/database";
import { useT } from "@/components/i18n/locale-provider";

// Leaflet needs the browser's window object, so the map is loaded on the client only.
const LocationMap = dynamic(() => import("@/components/studio/location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] rounded-xl" />,
});

export function LocationsTab({ locations }: { locations: LocationSuggestion[] }) {
  const t = useT();
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        {locations.map((location, index) => (
          <Card key={location.name}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{location.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("Təxmini icarə:")} <span className="font-medium text-foreground">{formatAZN(location.estimated_rent_azn)}</span> {t("/ ay")}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{location.reason}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("Uyğunluq balı")}</span>
                  <span className="font-semibold text-foreground">{location.fit_score}/100</span>
                </div>
                <Progress value={location.fit_score} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="lg:col-span-3">
        <LocationMap locations={locations} />
      </div>
    </div>
  );
}
