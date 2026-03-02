import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'imapflow',
    'mailparser',
    'googleapis',
    'string-similarity',
    'node-domexception',
  ],
};

export default nextConfig;
