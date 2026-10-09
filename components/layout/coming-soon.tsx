"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/components/i18n/locale-provider";

export function ComingSoon({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const t = useT();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
          <Icon className="size-7" />
        </span>
        <p className="text-lg font-medium">{t("Bu bölmə hazırlanır")}</p>
        <p className="max-w-md text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
