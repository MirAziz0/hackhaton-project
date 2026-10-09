import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdf.js) must run as a plain Node module, not bundled by webpack.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
