import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { NetworkClient } from "@/components/network/network-client";
import { PUBLIC_PROFILE_COLUMNS, type PublicProfile } from "@/lib/network";
import { getAuth } from "@/lib/supabase/server";

export const metadata = { title: "Şəbəkə — LaunchLens AI" };

export default async function NetworkPage() {
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .neq("id", user.id)
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader title="Şəbəkə" description="Sizə uyğun sahibkarları tapın və əlaqə qurun." />
      <NetworkClient userId={user.id} directory={(data as unknown as PublicProfile[] | null) ?? []} />
    </>
  );
}
