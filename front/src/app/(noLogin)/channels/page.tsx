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
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels`, {
      next: { revalidate: 300 }, // 5분마다 재검증
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

export default async function ChannelsPage() {
  // 서버에서 초기 데이터 가져오기
  const initialChannels = await getInitialChannels();

  return (
    <div>
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
    </div>
  );
}
