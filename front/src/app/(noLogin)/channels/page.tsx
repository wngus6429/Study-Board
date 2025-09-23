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
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels`, {
      // 채널 목록은 자주 변경되지 않으므로 긴 캐시 시간 설정
      next: {
        revalidate: 1800, // 30분(1800초)마다 재검증
        // 또는 revalidate: false로 설정하여 빌드 시에만 생성하고
        // 채널 생성/수정/삭제 시에만 on-demand revalidation 사용 가능
        // 장점: 서버 리소스 절약, 빠른 응답속도
        // 단점: 새 채널이 바로 반영되지 않음 (최대 30분 지연)
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
        <ChannelsClient initialChannels={initialChannels} />
      </Suspense>
    </>
  );
}

// Suspense: 클라이언트 컴포넌트 또는 비동기 자식이 준비될 때까지 // 대체 UI를 보여주기 위해 사용합니다. // -
// `fallback`으로 지정한 `<Loading />
// `은 ChannelsClient가 // 렌더링/하이드레이트되는 동안 사용자에게 표시됩니다. // - 이 페이지는 서버 컴포넌트지만
// ChannelsClient는 클라이언트 // 컴포넌트일 수 있으므로 Suspense로 로딩 상태를 관리합니다. // - SEO 측면: 서버에서
// 렌더된 정적 콘텐츠(JSON-LD, head 등)는 // 이미 제공되므로 Suspense의 fallback은 크롤러에 영향을 적게 줍니다.
