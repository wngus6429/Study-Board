"use client";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import CommentsView from "./CommentsView";
import Advertisement from "./Advertisement";
import ChannelTopStories from "./ChannelTopStories";
import { useComment } from "@/app/store/commentStore";
import { getChannelBySlug } from "@/app/api/channelsApi";

export default function RightView() {
  const { isCommentOpen } = useComment();
  const pathname = usePathname();

  // 현재 경로가 채널 페이지인지 확인
  const isChannelPage = pathname?.startsWith("/channels/");

  // URL에서 채널 slug 추출
  const channelSlug = isChannelPage && pathname ? pathname.split("/")[2] : null;

  // 채널 정보 조회
  const { data: channelData } = useQuery({
    queryKey: ["channel", "slug", channelSlug],
    queryFn: () => getChannelBySlug(channelSlug!),
    enabled: !!channelSlug && isCommentOpen,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  if (isCommentOpen) {
    return <CommentsView channelId={channelData?.id} channelCreatorId={channelData?.creator?.id} />;
  }

  return (
    <>
      {isChannelPage && <ChannelTopStories />}
      <Advertisement />
    </>
  );
}
