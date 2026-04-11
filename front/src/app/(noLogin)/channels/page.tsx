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
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels`, {
      next: { revalidate: 1800 },
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error("채널 데이터를 가져올 수 없습니다");
    }

    return { channels: await res.json(), isDbDisconnected: false };
  } catch (error) {
    console.error("초기 채널 데이터 로딩 실패, 화면 구성을 위해 샘플 데이터가 렌더링됩니다:", error);
    
    // UI 확인용 아주 눈에 띄는 대형 샘플 데이터
    const sampleChannels = [
      {
        id: -1,
        channel_name: "⚠️ 1. [테스트] 프론트엔드 스터디",
        slug: "sample-fe",
        description: "현재 백엔드(DB)가 연결되지 않아 보이는 화면입니다. 채널 목록이 이런 형태의 카드 UI로 나옵니다.",
        story_count: 55,
        subscriber_count: 320,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hidden: false,
        creator: { id: "0", nickname: "테스트어드민", user_email: "test@test.com" }
      },
      {
        id: -2,
        channel_name: "⚠️ 2. [테스트] 백엔드 스터디",
        slug: "sample-be",
        description: "프론트엔드 작동 여부를 확인할 수 있습니다. 디자인이 꽤 예쁘게 들어갔네요!",
        story_count: 12,
        subscriber_count: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hidden: false,
        creator: { id: "0", nickname: "테스트어드민", user_email: "test@test.com" }
      },
      {
        id: -3,
        channel_name: "⚠️ 3. [테스트] 일상/잡담 채널",
        slug: "sample-daily",
        description: "만약 DB가 정상 연결되어 있다면 실제 데이터가 여기 표시됩니다. 지금은 하드코딩된 더미 데이터입니다.",
        story_count: 312,
        subscriber_count: 1540,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hidden: false,
        creator: { id: "0", nickname: "테스트어드민", user_email: "test@test.com" }
      }
    ];

    return { channels: sampleChannels, isDbDisconnected: true };
  }
}

export default async function ChannelsPage() {
  // 서버에서 초기 데이터 가져오기
  const { channels: initialChannels, isDbDisconnected } = await getInitialChannels();

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
      {/*
        SEO용 JSON-LD 구조화 데이터 설명
        - numberOfItems: 서버에서 가져온 초기 채널 수(initialChannels.length)
        - itemListElement: 상위 5개 채널만 노출해 문서 크기 최소화(slice(0, 5)) ㅡ 크롤링용, 유저는 다 보임
        - 각 item: Organization(채널)로 name/description/url 제공
        - url: `NEXT_PUBLIC_BASE_URL` + 채널 slug로 절대경로 구성
        - JSON은 문자열로 주입해야 하므로 JSON.stringify + dangerouslySetInnerHTML 사용
        주의/확장
        - description이 없을 수 있어 기본값("채널 설명")을 사용
        - slug나 BASE_URL 누락 시 잘못된 URL이 생성될 수 있으니 환경변수 확인
        - 노출 개수 조정은 slice 범위 변경으로 가능, 리치결과 테스트로 검증 권장
        
        효과/이점(무엇이 좋아지나)
        - 검색엔진 이해도 향상: 이 페이지가 "채널 목록"임을 명확히 전달해 색인 정확도/안정성 개선
        - 발견성 향상: 각 채널 상세 URL을 구조화 데이터로 노출하여 크롤링 경로 보조 및 새로운 채널 발견성 증대
        - SERP 품질 개선: 목록/아이템 메타 정보(position, name, description)가 제공되어 더 정확한 요약/타이틀 선택에 도움
        - JS 의존도 감소: 서버에서 렌더된 JSON-LD라 JS 실행이 제한된 크롤러도 의미를 해석 가능
      */}
      <Suspense fallback={<Loading />}>
        <ChannelsClient initialChannels={initialChannels} isDbDisconnected={isDbDisconnected} />
      </Suspense>
    </>
  );
}

// Suspense: 클라이언트 컴포넌트 또는 비동기 자식이 준비될 때까지 // 대체 UI를 보여주기 위해 사용합니다. // -
// `fallback`으로 지정한 `<Loading />
// `은 ChannelsClient가 // 렌더링/하이드레이트되는 동안 사용자에게 표시됩니다. // - 이 페이지는 서버 컴포넌트지만
// ChannelsClient는 클라이언트 // 컴포넌트일 수 있으므로 Suspense로 로딩 상태를 관리합니다. // - SEO 측면: 서버에서
// 렌더된 정적 콘텐츠(JSON-LD, head 등)는 // 이미 제공되므로 Suspense의 fallback은 크롤러에 영향을 적게 줍니다.
