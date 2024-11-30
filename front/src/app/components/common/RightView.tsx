"use client";
import { useComment } from "@/app/store";
import CommentsView from "./CommentsView";
import Advertisement from "./Advertisement";

export default function RightView() {
  const { isCommentOpen } = useComment();
  console.log(isCommentOpen);
  return <>{isCommentOpen ? <CommentsView /> : <Advertisement />}</>;
}
