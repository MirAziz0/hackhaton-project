"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { id: "home", label: "Ana səhifə" },
  { id: "features", label: "İmkanlar" },
  { id: "how", label: "Necə işləyir" },
  { id: "audience", label: "Kimlər üçün" },
];

// Section menu of the landing page: clicking an item scrolls smoothly to its section, and a
// glass highlight slides to whichever section is currently on screen.
export function LandingNav() {
  const [active, setActive] = useState("home");
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  // While a click-triggered scroll is running, the observer must not move the highlight back.
  const lockedUntil = useRef(0);

  useLayoutEffect(() => {
    const measure = () => {
      const link = linkRefs.current[active];
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

  // Follow the scroll position: the section crossing the upper part of the viewport is active.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockedUntil.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[visible.length - 1].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const { id } of LINKS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  function go(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lockedUntil.current = Date.now() + 900;
    setActive(id);
    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav aria-label="Səhifə bölmələri" className="relative hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm md:flex">
      {pill && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-1 top-1 rounded-full bg-white/15 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]",
            animate && "transition-[left,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          )}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {LINKS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          ref={(element) => {
            linkRefs.current[id] = element;
          }}
          onClick={(event) => go(event, id)}
          aria-current={active === id ? "true" : undefined}
          className={cn(
            "relative z-10 rounded-full px-4 py-2 transition-colors duration-300",
            active === id ? "text-white" : "text-white/70 hover:text-white",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
