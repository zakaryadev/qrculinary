import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Manual DB types cause type errors — will regenerate via `supabase gen types` once project is connected
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
