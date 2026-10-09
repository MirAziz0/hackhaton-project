import { LayoutDashboard } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Dashboard — LaunchLens AI" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Gəlir və xərclərinizi izləyin, AI köməkçidən məsləhət alın."
      />
      <ComingSoon
        icon={LayoutDashboard}
        text="Tezliklə burada göstəriciləriniz, qrafiklər və AI köməkçi olacaq."
      />
    </>
  );
}
