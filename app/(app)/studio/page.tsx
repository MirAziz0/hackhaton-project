import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { getAuth } from "@/lib/supabase/server";
import type { Business } from "@/types/database";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("Studiya")} — Growenta` };
}

export default async function StudioPage() {
  const t = await getT();
  const { supabase, user } = await getAuth();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title={t("İdeya Studiyası")}
        description={t("İdeyanızı biznes plana, maliyyə proqnozuna və brendə çevirin.")}
      />
      <StudioWorkspace userId={user.id} savedBusinesses={(data as Business[] | null) ?? []} />
    </>
  );
}
