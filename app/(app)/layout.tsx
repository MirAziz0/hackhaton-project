import { redirect } from "next/navigation";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Sidebar } from "@/components/layout/sidebar";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/login");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <div className="min-h-screen">
      <Sidebar profile={profile} />
      <main className="min-h-screen pl-64">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
      <ChatWidget />
    </div>
  );
}
