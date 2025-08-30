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
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/upload/:slug`, // Matched parameters can be used in the destination
      },
      {
        source: "/videoUpload/:slug",
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/videoUpload/:slug`, // 동영상 파일
      },
    ];
  },
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // iframe 삽입 차단
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // MIME 타입 스니핑 방지
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin", // 참조자 정책
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // 권한 정책
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // XSS 필터링 활성화
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // HTTPS 강제
          },
        ],
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
