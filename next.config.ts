import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep visited pages in the client router cache for a short while, so going back and forth
    // between sidebar items is instant. Mutations call router.refresh() to drop stale copies.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
