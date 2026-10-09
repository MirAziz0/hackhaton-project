"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Error boundary for every page inside the app shell: the sidebar stays usable.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <TriangleAlert className="size-7" />
        </span>
        <p className="text-lg font-medium">Səhifəni yükləmək mümkün olmadı</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Gözlənilməz xəta baş verdi. Yenidən cəhd edin; problem davam edərsə, səhifəni yeniləyin.
        </p>
        <Button className="mt-2" onClick={reset}>
          Yenidən cəhd et
        </Button>
      </CardContent>
    </Card>
  );
}
