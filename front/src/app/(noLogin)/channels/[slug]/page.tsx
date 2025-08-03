// 채널 상세 페이지 - 서버 컴포넌트로 SEO 최적화
import { Metadata } from "next";
import { Suspense, useMemo } from "react";
import { notFound } from "next/navigation";
import ChannelDetailPage from "./ChannelsDetailClient";
import Loading from "@/app/components/common/Loading";

// 서버에서 특정 채널 데이터 가져오기
async function getChannelData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/channels/slug/${slug}`, {
      next: {
        revalidate: 1800, // 30분마다 재검증 (채널 정보는 상대적으로 자주 변경될 수 있음)
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null; // 채널이 존재하지 않음
      }
      throw new Error("채널 데이터를 가져올 수 없습니다");
    }

    return await res.json();
  } catch (error) {
    console.error("채널 데이터 로딩 실패:", error);
    return null;
  }
}

// 동적 메타데이터 생성 (최적화됨)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const channelData = await getChannelData(params.slug);

  if (!channelData) {
    return {
      title: "채널을 찾을 수 없습니다 - Hobby Channel",
      description: "요청하신 채널을 찾을 수 없습니다.",
    };
  }

  // 메타데이터에 필요한 값들을 미리 계산
  const channelName = channelData.channel_name;
  const subscriberCount = channelData.subscriber_count || 0;
  const storyCount = channelData.story_count || 0;
  const creatorName = channelData.creator?.nickname || "알수없음";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const channelUrl = `${baseUrl}/channels/${params.slug}`;
  const formattedSubscriberCount = subscriberCount.toLocaleString();
  const formattedStoryCount = storyCount.toLocaleString();

  // 공통 설명 텍스트
  const description = `${channelName} 채널입니다. ${creatorName}님이 만든 채널로 구독자 ${formattedSubscriberCount}명, 게시글 ${formattedStoryCount}개가 있습니다. 다양한 주제로 소통해보세요!`;
  const shortDescription = `${channelName} 채널 - 구독자 ${formattedSubscriberCount}명의 활발한 커뮤니티`;
  const titleText = `${channelName} - Hobby Channel`;

  return {
    title: titleText,
    description,
    keywords: [channelName, "채널", "커뮤니티", "게시판", "소통", creatorName, "취미", "관심사", params.slug],
    openGraph: {
      title: titleText,
      description: shortDescription,
      type: "website",
      locale: "ko_KR",
      url: channelUrl,
      siteName: "Hobby Channel",
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description: shortDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: channelUrl,
    },
  };
}

export default async function ChannelPage({ params }: { params: { slug: string } }) {
  // 서버에서 채널 데이터 가져오기
  const channelData = await getChannelData(params.slug);

  // 채널이 존재하지 않으면 404 페이지로 리다이렉트
  if (!channelData) {
    notFound();
  }

  // 공통 값들 미리 계산
  const channelName = channelData.channel_name;
  const creatorName = channelData.creator?.nickname || "알수없음";
  const subscriberCount = channelData.subscriber_count || 0;
  const storyCount = channelData.story_count || 0;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const channelUrl = `${baseUrl}/channels/${params.slug}`;

  // 구조화된 데이터 생성 (최적화됨)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: channelName,
    description: `${channelName} 채널 - ${creatorName}님이 만든 커뮤니티`,
    url: channelUrl,
    founder: {
      "@type": "Person",
      name: creatorName,
    },
    memberOf: {
      "@type": "Organization",
      name: "Hobby Channel",
      url: baseUrl,
    },
    ...(subscriberCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.5",
        reviewCount: subscriberCount,
        bestRating: "5",
        worstRating: "1",
      },
    }),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/SubscribeAction",
        userInteractionCount: subscriberCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WriteAction",
        userInteractionCount: storyCount,
      },
    ],
    dateCreated: channelData.created_at,
    knowsAbout: [channelName, "커뮤니티", "소통", "취미"],
  };

  return (
    <>
      {/* 구조화된 데이터 추가 (SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <Suspense fallback={<Loading />}>
        <ChannelDetailPage />
      </Suspense>
    </>
  );
}
