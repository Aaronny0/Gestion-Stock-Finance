import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@vortex/contracts"],
    reactStrictMode: true,
    distDir: process.env.VORTEX_BUILD_DIR || ".next",
};

export default nextConfig;
