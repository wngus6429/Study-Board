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
};

export default nextConfig;
