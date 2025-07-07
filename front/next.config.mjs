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
        destination: "https://api.park-aws-study.com/upload/:slug", // ✅ 프로토콜 포함
      },
      {
        source: "/videoUpload/:slug",
        destination: "https://api.park-aws-study.com/videoUpload/:slug", // ✅
      },
    ];
  },
  // 컴파일시 console.log 제거, error는 냅둠
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"], // error는 유지
          }
        : false,
  },
};

export default nextConfig;
