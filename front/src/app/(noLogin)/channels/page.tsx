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
    // Next.js App Router의 서버 사이드에서 API 호출
    // 이 함수는 서버 컴포넌트에서 실행되므로 서버에서 직접 백엔드 API를 호출
    // 빌드 시에는 API 호출 건너뛰기
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_BASE_URL) {
      return [];
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels`, {
      // 채널 목록은 자주 변경되지 않으므로 긴 캐시 시간 설정
      next: {
        revalidate: 3600, // 1시간(3600초)마다 재검증
        // 또는 revalidate: false로 설정하여 빌드 시에만 생성하고
        // 채널 생성/수정/삭제 시에만 on-demand revalidation 사용 가능
        // 장점: 서버 리소스 절약, 빠른 응답속도
        // 단점: 새 채널이 바로 반영되지 않음 (최대 1시간 지연)
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
    // API 호출 실패 시 빈 배열 반환하여 페이지가 크래시되지 않도록 처리
    // 클라이언트 사이드에서 React Query가 다시 시도할 수 있음
    console.error("초기 채널 데이터 로딩 실패:", error);
    return [];
  }
}

export default async function ChannelsPage() {
  // 서버에서 초기 데이터 가져오기
  const initialChannels = await getInitialChannels();

  return (
    <>
      {/* 구조화된 데이터 추가 (SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "채널 목록",
            description: "다양한 취미와 관심사별 채널들을 둘러보세요",
            numberOfItems: initialChannels.length,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: initialChannels.slice(0, 5).map((channel: any, index: number) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Organization",
                  name: channel.channel_name,
                  description: channel.description || "채널 설명",
                  url: `${process.env.NEXT_PUBLIC_BASE_URL}/channels/${channel.slug}`,
                },
              })),
            },
          }),
        }}
      />

      <Suspense fallback={<Loading />}>
        <ChannelsClient initialChannels={initialChannels} />
      </Suspense>
    </>
  );
}
