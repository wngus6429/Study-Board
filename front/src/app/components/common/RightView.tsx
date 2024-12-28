"use client";
import CommentsView from "./CommentsView";
import Advertisement from "./Advertisement";
import { useComment } from "@/app/store/commentStore";

export default function RightView() {
  const { isCommentOpen } = useComment();

  return <>{isCommentOpen ? <CommentsView /> : <Advertisement />}</>;
}
