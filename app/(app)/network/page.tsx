import { Users } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Şəbəkə — LaunchLens AI" };

export default function NetworkPage() {
  return (
    <>
      <PageHeader title="Şəbəkə" description="Sizə uyğun sahibkarları tapın və əlaqə qurun." />
      <ComingSoon
        icon={Users}
        text="Tezliklə burada süni intellektin sizə tövsiyə etdiyi sahibkarları görəcəksiniz."
      />
    </>
  );
}
