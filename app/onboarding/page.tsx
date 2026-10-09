import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { homeForStage } from "@/lib/constants";
import { getSessionProfile } from "@/lib/supabase/server";

export const metadata = { title: "Başlayaq — Growenta" };

export default async function OnboardingPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/login");
  if (profile?.onboarding_completed) redirect(homeForStage(profile.stage));

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      <Logo className="mb-10" />
      <OnboardingWizard userId={user.id} />
    </div>
  );
}
