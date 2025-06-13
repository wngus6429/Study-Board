"use client";
import { usePathname } from "next/navigation";
import CommentsView from "./CommentsView";
import Advertisement from "./Advertisement";
import ChannelTopStories from "./ChannelTopStories";
import { useComment } from "@/app/store/commentStore";

export default function RightView() {
  const { isCommentOpen } = useComment();
  const pathname = usePathname();

  // 현재 경로가 채널 페이지인지 확인
  const isChannelPage = pathname?.startsWith("/channels/");

  if (isCommentOpen) {
    return <CommentsView />;
  }

  return (
    <>
      {isChannelPage && <ChannelTopStories />}
      <Advertisement />
    </>
  );
}
