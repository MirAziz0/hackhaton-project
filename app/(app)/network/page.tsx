import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { NetworkClient } from "@/components/network/network-client";
import { PUBLIC_PROFILE_COLUMNS, type PublicProfile } from "@/lib/network";
import { getAuth } from "@/lib/supabase/server";

export const metadata = { title: "Şəbəkə — Growenta" };

export default async function NetworkPage() {
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");

  // One query returns everyone, including the signed-in user, whose row drives the matching.
  const { data } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .limit(101);

  const everyone = (data as unknown as PublicProfile[] | null) ?? [];
  const me = everyone.find((profile) => profile.id === user.id);
  if (!me) redirect("/onboarding");

  return (
    <>
      <PageHeader title="Şəbəkə" description="Sizə uyğun sahibkarları tapın və əlaqə qurun." />
      <NetworkClient me={me} directory={everyone.filter((profile) => profile.id !== user.id)} />
    </>
  );
}
