import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: false, // Enable PWA in dev mode for mobile testing
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
