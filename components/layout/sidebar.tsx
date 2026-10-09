"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Lightbulb, LogOut, SearchCheck, UserRound, Users } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { trackLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/studio", label: "Studiya", icon: Lightbulb },
  { href: "/analysis", label: "Analiz", icon: SearchCheck },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/network", label: "Şəbəkə", icon: Users },
  { href: "/profile", label: "Profil", icon: UserRound },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <Logo dark />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href: baseHref, label, icon: Icon }) => {
          const active = pathname === baseHref || pathname.startsWith(`${baseHref}/`);
          // Link straight to the user's own profile instead of going through a redirect page.
          const href = baseHref === "/profile" ? `/profile/${profile.id}` : baseHref;
          return (
            <Link
              key={baseHref}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-white shadow-sm" : "hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {initials(profile.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile.full_name || "İstifadəçi"}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">{trackLabel(profile.track)}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Çıxış"
            title="Çıxış"
            className="rounded-md p-2 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
