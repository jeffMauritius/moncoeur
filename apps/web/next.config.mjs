/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/seed-excel": ["./data/**/*"],
    },
  },
};

export default nextConfig;
