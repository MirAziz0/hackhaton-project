import { Lightbulb } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Studiya — LaunchLens AI" };

export default function StudioPage() {
  return (
    <>
      <PageHeader
        title="İdeya Studiyası"
        description="İdeyanızı biznes plana, maliyyə proqnozuna və brendə çevirin."
      />
      <ComingSoon
        icon={Lightbulb}
        text="Tezliklə burada ideyanızı yazıb süni intellektdən tam biznes planı ala biləcəksiniz."
      />
    </>
  );
}
