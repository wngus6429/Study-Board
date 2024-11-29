"use client";
import { useComment } from "@/app/store";
import CommentsView from "./CommentsView";
import Advertisement from "./Advertisement";
import { useEffect } from "react";

export default function RightView() {
  const { isCommentOpen, commentsData } = useComment();

  useEffect(() => {
    console.log("RightView", isCommentOpen, commentsData);
  }, [isCommentOpen, commentsData]); // 상태 변화 감지

  return <>{isCommentOpen ? <CommentsView commentsData={commentsData} /> : <Advertisement />}</>;
}
