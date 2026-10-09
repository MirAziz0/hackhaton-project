import { redirect } from "next/navigation";
import { AnalysisWorkspace } from "@/components/analysis/analysis-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { getSessionProfile } from "@/lib/supabase/server";
import type { Analysis } from "@/types/analysis";

export const metadata = { title: "Analiz — LaunchLens AI" };

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const { business: requestedId } = await searchParams;
  const { supabase, user, profile } = await getSessionProfile();
  if (!user) redirect("/login");

  const { data: businessRows } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const businesses = (businessRows as { id: string; name: string }[] | null) ?? [];

  // Newest first, so the first analysis seen for each business is its latest one.
  const latestAnalyses: Record<string, Analysis> = {};
  if (businesses.length) {
    const { data: analysisRows } = await supabase
      .from("analyses")
      .select("*")
      .in("business_id", businesses.map((business) => business.id))
      .order("created_at", { ascending: false });
    for (const analysis of (analysisRows as Analysis[] | null) ?? []) {
      latestAnalyses[analysis.business_id] ??= analysis;
    }
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
