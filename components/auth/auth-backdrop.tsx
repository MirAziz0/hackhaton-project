"use client";

import { useEffect, useState } from "react";
import AnimatedGradient, { type GradientConfig } from "@/components/ui/animated-gradient";

// Flowing pink-to-blue ribbons on black, in the spirit of the sign-in reference design.
const RIBBONS: GradientConfig = {
  preset: "custom",
  color1: "#05030d",
  color2: "#ff2bb0",
  color3: "#2f7dff",
  rotation: -14,
  proportion: 52,
  scale: 0.2,
  speed: 12,
  distortion: 2,
  swirl: 46,
  swirlIterations: 4,
  softness: 72,
  offset: 60,
  shape: "Stripes",
  shapeSize: 34,
};

interface AuthBackdropProps {
  // "page" sits fixed behind the whole screen; "panel" fills its (relative, isolated) parent.
  variant: "page" | "panel";
}

export function AuthBackdrop({ variant }: AuthBackdropProps) {
  const [config, setConfig] = useState<GradientConfig>(RIBBONS);

  // People who ask for reduced motion get the same picture, frozen.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setConfig(query.matches ? { ...RIBBONS, speed: 0 } : RIBBONS);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <AnimatedGradient
      config={config}
      noise={{ opacity: 0.2, scale: 1 }}
      // The page copy is dimmed so the card stands out; the panel copy keeps its full colour.
      style={variant === "page" ? { position: "fixed", opacity: 0.6 } : undefined}
    />
  );
}
