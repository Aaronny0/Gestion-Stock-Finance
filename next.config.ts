import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
    reactStrictMode: true,
    distDir: process.env.VORTEX_BUILD_DIR || ".next",
};

export default nextConfig;
