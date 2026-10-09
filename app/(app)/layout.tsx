import { redirect } from "next/navigation";
import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatWidget } from "@/components/chat/chat-widget";
import { TopNav } from "@/components/layout/top-nav";
import { getSessionProfile } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/login");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    // The provider lets any page (network cards, profiles) open the chat on a given person.
    <ChatProvider currentUserId={profile.id}>
      <div className="app-backdrop min-h-screen">
        <TopNav profile={profile} />
        <main className="mx-auto max-w-[96rem] px-4 pb-12 pt-2 sm:px-5 lg:px-10">{children}</main>
        <ChatWidget />
      </div>
    </ChatProvider>
  );
}
