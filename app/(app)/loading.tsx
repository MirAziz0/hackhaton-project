import { Skeleton } from "@/components/ui/skeleton";
import { getT } from "@/lib/i18n/server";

// Shown instantly while a page in the app shell loads its data, so navigating between
// sidebar items never looks frozen.
export default async function AppLoading() {
  const t = await getT();
  return (
    <div aria-busy="true" aria-label={t("Yüklənir")}>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}
