import { redirect } from "next/navigation";
import { AnalysisWorkspace } from "@/components/analysis/analysis-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { getAuth, getSessionProfile } from "@/lib/supabase/server";
import type { Analysis } from "@/types/analysis";

export const metadata = { title: "Analiz — LaunchLens AI" };

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const { business: requestedId } = await searchParams;
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");

  // The profile and the businesses (with their analyses) load in parallel.
  const [{ profile }, { data: businessRows }] = await Promise.all([
    getSessionProfile(),
    supabase
      .from("businesses")
      .select("id, name, analyses(*)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "analyses", ascending: false }),
  ]);
  const rows = (businessRows as { id: string; name: string; analyses: Analysis[] }[] | null) ?? [];
  const businesses = rows.map(({ id, name }) => ({ id, name }));

  // Analyses arrive newest first, so the first one of each business is its latest.
  const latestAnalyses: Record<string, Analysis> = {};
  for (const row of rows) {
    if (row.analyses?.[0]) latestAnalyses[row.id] = row.analyses[0];
  }

  const initialBusinessId = businesses.some((business) => business.id === requestedId) ? requestedId! : null;

  return (
    <>
      <PageHeader
        title="Biznes Analizi"
        description="Planınızı real bazar məlumatları ilə yoxlayın və investisiyaya hazırlıq balını öyrənin."
      />
      <AnalysisWorkspace
        businesses={businesses}
        latestAnalyses={latestAnalyses}
        initialBusinessId={initialBusinessId}
        defaults={{
          sector: profile?.track ?? "other",
          location: profile?.city ?? "",
          products: profile?.products ?? "",
        }}
      />
    </>
  );
}
