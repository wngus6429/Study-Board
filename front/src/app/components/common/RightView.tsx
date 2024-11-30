"use client";
import { useComment } from "@/app/store";
import CommentsView from "./CommentsView";
import Advertisement from "./Advertisement";

export default function RightView() {
  const { isCommentOpen } = useComment();

  return <>{isCommentOpen ? <CommentsView /> : <Advertisement />}</>;
}
