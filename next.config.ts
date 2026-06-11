import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // These packages need to be externalized — not bundled into the standalone output
  serverExternalPackages: ["ws"],
};

export default nextConfig;
