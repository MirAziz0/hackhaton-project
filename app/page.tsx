import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { homeForStage } from "@/lib/constants";
import { getSessionProfile } from "@/lib/supabase/server";

// Visitors see the landing page; signed-in users go straight to their start page.
export default async function HomePage() {
  const { user, profile } = await getSessionProfile();

  if (!user) return <LandingPage />;
  if (!profile?.onboarding_completed) redirect("/onboarding");
  redirect(homeForStage(profile.stage));
}
