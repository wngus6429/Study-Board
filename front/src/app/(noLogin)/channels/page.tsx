// 채널 목록 페이지 - 서버 컴포넌트로 SEO 최적화
import { Metadata } from "next";
import { Suspense } from "react";
import ChannelsClient from "./ChannelsClient";
import Loading from "@/app/components/common/Loading";

// SEO를 위한 정적 메타데이터
export const metadata: Metadata = {
  title: "채널 목록 - Hobby Channel",
  description: "다양한 취미와 관심사별 채널들을 둘러보세요. 새로운 채널을 만들거나 관심있는 채널에 참여할 수 있습니다.",
  keywords: ["채널", "취미", "커뮤니티", "관심사", "게시판", "소통"],
  openGraph: {
    title: "채널 목록 - Hobby Channel",
    description: "다양한 취미와 관심사별 채널들을 둘러보세요",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "채널 목록 - Hobby Channel",
    description: "다양한 취미와 관심사별 채널들을 둘러보세요",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 서버에서 초기 채널 데이터 가져오기
async function getInitialChannels() {
  try {
    // 빌드 시에는 API 호출 건너뛰기
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_BASE_URL) {
      return [];
    }

    // Next.js App Router의 서버 사이드에서 API 호출
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels`, {
      next: {
        revalidate: 3600, // 1시간(3600초)마다 재검증
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("채널 데이터를 가져올 수 없습니다");
    }

    return await res.json();
  } catch (error) {
    console.error("초기 채널 데이터 로딩 실패:", error);
    return [];
  }
}

export default function ChannelsPage() {
  // 서버에서 초기 데이터를 가져오지 않고 클라이언트에서만 처리
  return (
    <>
      {/* 구조화된 데이터는 기본값으로 설정 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "채널 목록",
            description: "다양한 취미와 관심사별 채널들을 둘러보세요",
          }),
        }}
      />

      <Suspense fallback={<Loading />}>
        <ChannelsClient initialChannels={[]} />
      </Suspense>
    </>
  );
}
