"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

// useLayoutEffect warns during server rendering; fall back to useEffect there.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Top navigation for the signed-in area: logo, pill menu, quick action and the user.
export function TopNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileHref = `/profile/${profile.id}`;

  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  // Position of the sliding highlight behind the active menu item.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  // The first placement must not animate, otherwise the pill would slide in from the corner.
  const [animate, setAnimate] = useState(false);
  // The clicked item is highlighted at once, before the new page has finished loading.
  const [pending, setPending] = useState<string | null>(null);

  const routeActive = NAV_ITEMS.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`))?.href ?? null;
  const active = pending ?? routeActive;

  useEffect(() => {
    setPending(null);
  }, [pathname]);

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const link = active ? linkRefs.current[active] : null;
      setPill(link ? { left: link.offsetLeft, width: link.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  useEffect(() => {
    if (!pill || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [pill, animate]);

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
        ref={navRef}
        aria-label="Əsas menyu"
        className="relative order-last flex w-full gap-1 overflow-x-auto rounded-full bg-[#fbf7dc] p-1.5 shadow-card md:order-none md:w-auto"
      >
        {pill && (
          <span
            aria-hidden
            className={cn(
              "bg-brand pointer-events-none absolute bottom-1.5 top-1.5 rounded-full shadow-[0_6px_14px_-6px_rgb(109_61_245/0.7)]",
              animate && "transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            )}
            style={{ left: pill.left, width: pill.width }}
          />
        )}

        {NAV_ITEMS.map(({ href: baseHref, label }) => {
          const isActive = active === baseHref;
          // Link straight to the user's own profile instead of going through a redirect page.
          const href = baseHref === "/profile" ? profileHref : baseHref;
          return (
            <Link
              key={baseHref}
              href={href}
              ref={(element) => {
                linkRefs.current[baseHref] = element;
              }}
              onClick={() => {
                if (routeActive !== baseHref) setPending(baseHref);
              }}
              aria-current={routeActive === baseHref ? "page" : undefined}
              className={cn(
                "relative z-10 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300",
                isActive ? "text-white" : "text-foreground/80 hover:bg-white/70 hover:text-foreground",
                // Before the pill is measured (first paint), the active item carries the highlight itself.
                isActive && !pill && "bg-brand",
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
