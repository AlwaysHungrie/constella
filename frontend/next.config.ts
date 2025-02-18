import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@privy-io/react-auth', 'preact'],
  webpack: (config) => {
    // Enable proper handling of ES modules
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false
      }
    });

    return config;
  }
};

export default nextConfig;
