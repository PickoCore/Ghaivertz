/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // jszip needs this for browser builds
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  },
};
export default nextConfig;
