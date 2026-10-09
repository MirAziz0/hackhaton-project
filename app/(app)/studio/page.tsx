import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";

export const metadata = { title: "Studiya — LaunchLens AI" };

export default async function StudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="İdeya Studiyası"
        description="İdeyanızı biznes plana, maliyyə proqnozuna və brendə çevirin."
      />
      <StudioWorkspace userId={user.id} savedBusinesses={(data as Business[] | null) ?? []} />
    </>
  );
}
