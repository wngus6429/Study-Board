"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import CommentsView from "../comment/CommentsView";
import Advertisement from "./Advertisement";
import ChannelTopStories from "./ChannelTopStories";
import SubscribedChannelsPanel from "./SubscribedChannelsPanel";
import { getChannelBySlug } from "@/app/api/channelsApi";

export default function RightView() {
  const [isTabletLayout, setIsTabletLayout] = useState(false);
  const pathname = usePathname();

  // 현재 경로가 채널 페이지인지 확인
  const isChannelPage = pathname?.startsWith("/channels/");
  const isChannelStoryDetailPage = Boolean(pathname?.match(/^\/channels\/[^/]+\/detail\/story\/[^/]+$/));
  const isChannelIndexPage = Boolean(pathname?.match(/^\/channels\/[^/]+$/));

  // URL에서 채널 slug 추출
  const channelSlug = isChannelPage && pathname ? pathname.split("/")[2] : null;

  // 게시글 상세에서는 1500px 이하일 때 댓글을 본문 아래에 표시
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(max-width: 1500px)");
    const update = () => setIsTabletLayout(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const shouldShowComments = isChannelStoryDetailPage;

  // 채널 정보 조회
  const { data: channelData } = useQuery({
    queryKey: ["channel", "slug", channelSlug],
    queryFn: () => getChannelBySlug(channelSlug!),
    enabled: !!channelSlug && shouldShowComments,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  if (shouldShowComments) {
    return <CommentsView channelId={channelData?.id} channelCreatorId={channelData?.creator?.id} />;
  }

  return (
    <>
      {isChannelPage && <ChannelTopStories />}
      {isChannelIndexPage && isTabletLayout && <SubscribedChannelsPanel />}
      <Advertisement />
    </>
  );
}
