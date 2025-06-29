/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/upload/:slug",
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/upload/:slug`, // Matched parameters can be used in the destination
      },
      {
        source: "/videoUpload/:slug",
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/videoUpload/:slug`, // 동영상 파일
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
