/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/upload/:slug",
        destination: "https://api.park-aws-study.com/upload/:slug",
      },
      {
        source: "/videoUpload/:slug",
        destination: "https://api.park-aws-study.com/videoUpload/:slug",
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

// ✅ CommonJS export로 변경
module.exports = nextConfig;
