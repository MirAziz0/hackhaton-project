import { SearchCheck } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Analiz — LaunchLens AI" };

export default function AnalysisPage() {
  return (
    <>
      <PageHeader
        title="Biznes Analizi"
        description="Planınızı real bazar məlumatları ilə yoxlayın və investisiyaya hazırlıq balını öyrənin."
      />
      <ComingSoon
        icon={SearchCheck}
        text="Tezliklə burada biznes planınızı yükləyib mənbələri göstərilən ətraflı təhlil ala biləcəksiniz."
      />
    </>
  );
}
