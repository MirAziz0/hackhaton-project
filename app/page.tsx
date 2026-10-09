import { redirect } from "next/navigation";
import { homeForStage } from "@/lib/constants";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function HomePage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/login");
  if (!profile?.onboarding_completed) redirect("/onboarding");
  redirect(homeForStage(profile.stage));
}
