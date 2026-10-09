"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { trackLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/studio", label: "Studiya" },
  { href: "/analysis", label: "Analiz" },
  { href: "/network", label: "Şəbəkə" },
  { href: "/profile", label: "Profil" },
];

// Top navigation for the signed-in area: logo, pill menu, quick action and the user.
export function TopNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileHref = `/profile/${profile.id}`;

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-5 lg:px-10">
      <Link href="/" aria-label="Ana səhifə">
        <Logo />
      </Link>

      <nav
        aria-label="Əsas menyu"
        className="order-last flex w-full gap-1 overflow-x-auto rounded-full bg-[#fbf7dc] p-1.5 shadow-card md:order-none md:w-auto"
      >
        {NAV_ITEMS.map(({ href: baseHref, label }) => {
          const active = pathname === baseHref || pathname.startsWith(`${baseHref}/`);
          // Link straight to the user's own profile instead of going through a redirect page.
          const href = baseHref === "/profile" ? profileHref : baseHref;
          return (
            <Link
              key={baseHref}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-white shadow-[0_6px_14px_-6px_rgb(109_61_245/0.7)]"
                  : "text-foreground/80 hover:bg-white/70 hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <Link href="/studio" className={buttonVariants({ className: "h-11 px-5" })}>
          <Plus />
          <span className="hidden sm:inline">Yeni ideya</span>
        </Link>

        <Link href={profileHref} className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/60">
          <span className="bg-brand flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
            {initials(profile.full_name)}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block max-w-40 truncate text-sm font-semibold">{profile.full_name || "İstifadəçi"}</span>
            <span className="block max-w-40 truncate text-xs text-muted-foreground">{trackLabel(profile.track)}</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={signOut}
          aria-label="Çıxış"
          title="Çıxış"
          className="flex size-10 items-center justify-center rounded-full bg-white/70 text-muted-foreground shadow-card transition-colors hover:bg-white hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
