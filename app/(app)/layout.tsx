import { redirect } from "next/navigation";
import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Sidebar } from "@/components/layout/sidebar";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/login");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    // The provider lets any page (network cards, profiles) open the chat on a given person.
    <ChatProvider currentUserId={profile.id}>
      <div className="min-h-screen">
        <Sidebar profile={profile} />
        <main className="min-h-screen pl-64">
          <div className="mx-auto max-w-[90rem] px-8 py-8">{children}</div>
        </main>
        <ChatWidget />
      </div>
    </ChatProvider>
  );
}
