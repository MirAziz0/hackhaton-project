"use client";

import { useEffect, useState } from "react";
import AnimatedGradient, { type GradientConfig } from "@/components/ui/animated-gradient";

// The "Prism" look of the animated gradient, recoloured to the landing page's navy and violet.
const BASE: GradientConfig = {
  preset: "custom",
  color1: "#07061a",
  color2: "#6d5cff",
  color3: "#c7d7ff",
  rotation: -50,
  proportion: 1,
  scale: 0.01,
  speed: 22,
  distortion: 0,
  swirl: 50,
  swirlIterations: 16,
  softness: 47,
  offset: -299,
  shape: "Checks",
  shapeSize: 45,
};

// Animated WebGL background for the whole landing page. It is fixed to the viewport, so it
// stays in place behind the content while the page scrolls. Where WebGL2 is unavailable the
// canvas stays transparent and the page's own dark backdrop shows instead.
export function LandingBackground() {
  const [config, setConfig] = useState<GradientConfig>(BASE);

  // People who ask for reduced motion get the same picture, frozen.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setConfig(query.matches ? { ...BASE, speed: 0 } : BASE);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <AnimatedGradient config={config} noise={{ opacity: 0.25, scale: 1 }} style={{ position: "fixed" }} />
      {/* A thin dark veil over the gradient so white text stays readable on the bright beams. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] bg-[#07061a]/45" />
    </>
  );
}
