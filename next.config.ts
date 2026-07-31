import type { NextConfig } from "next";
import { validateEnvironment } from "./src/config/environment";

validateEnvironment(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
