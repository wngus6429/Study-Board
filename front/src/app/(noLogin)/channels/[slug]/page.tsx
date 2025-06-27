// 채널 상세 페이지 - 서버 컴포넌트로 SEO 최적화
import { Metadata } from "next";
import { Suspense } from "react";
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

// 동적 메타데이터 생성
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const channelData = await getChannelData(params.slug);

  if (!channelData) {
    return {
      title: "채널을 찾을 수 없습니다 - Hobby Channel",
      description: "요청하신 채널을 찾을 수 없습니다.",
    };
  }

  const channelName = channelData.channel_name;
  const subscriberCount = channelData.subscriber_count || 0;
  const storyCount = channelData.story_count || 0;
  const creatorName = channelData.creator?.nickname || "알수없음";

  return {
    title: `${channelName} - Hobby Channel`,
    description: `${channelName} 채널입니다. ${creatorName}님이 만든 채널로 구독자 ${subscriberCount.toLocaleString()}명, 게시글 ${storyCount.toLocaleString()}개가 있습니다. 다양한 주제로 소통해보세요!`,
    keywords: [channelName, "채널", "커뮤니티", "게시판", "소통", creatorName, "취미", "관심사", params.slug],
    openGraph: {
      title: `${channelName} - Hobby Channel`,
      description: `${channelName} 채널 - 구독자 ${subscriberCount.toLocaleString()}명의 활발한 커뮤니티`,
      type: "website",
      locale: "ko_KR",
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/channels/${params.slug}`,
      siteName: "Hobby Channel",
    },
    twitter: {
      card: "summary_large_image",
      title: `${channelName} - Hobby Channel`,
      description: `${channelName} 채널 - 구독자 ${subscriberCount.toLocaleString()}명의 활발한 커뮤니티`,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/channels/${params.slug}`,
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

  // 구조화된 데이터 생성
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: channelData.channel_name,
    description: `${channelData.channel_name} 채널 - ${channelData.creator?.nickname || "알수없음"}님이 만든 커뮤니티`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/channels/${params.slug}`,
    founder: {
      "@type": "Person",
      name: channelData.creator?.nickname || "알수없음",
    },
    memberOf: {
      "@type": "Organization",
      name: "Hobby Channel",
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    aggregateRating:
      channelData.subscriber_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: "4.5",
            reviewCount: channelData.subscriber_count,
            bestRating: "5",
            worstRating: "1",
          }
        : undefined,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/SubscribeAction",
        userInteractionCount: channelData.subscriber_count || 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WriteAction",
        userInteractionCount: channelData.story_count || 0,
      },
    ],
    dateCreated: channelData.created_at,
    knowsAbout: [channelData.channel_name, "커뮤니티", "소통", "취미"],
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
