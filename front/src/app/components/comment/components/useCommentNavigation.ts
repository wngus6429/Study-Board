import { useCallback, useEffect } from "react";
import axios from "axios";

interface UseCommentNavigationProps {
  storyId: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  viewCount: number;
  CommentData: any;
}

export const useCommentNavigation = ({
  storyId,
  currentPage,
  setCurrentPage,
  viewCount,
  CommentData,
}: UseCommentNavigationProps) => {
  // 특정 댓글로 스크롤하는 함수 (메모이제이션)
  const scrollToComment = useCallback((commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // 댓글이 포함된 페이지를 찾아서 이동하는 함수 (메모이제이션)
  const findAndNavigateToCommentPage = useCallback(
    async (commentId: number) => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/comment/${storyId}/page/${commentId}?limit=${viewCount}`
        );
        const { page } = response.data;

        // 해당 페이지로 이동
        if (page !== currentPage) {
          setCurrentPage(page);
          // 페이지 변경 후 댓글 로딩을 기다린 후 스크롤
          setTimeout(() => {
            scrollToComment(commentId.toString());
          }, 1500);
        } else {
          // 이미 해당 페이지에 있다면 바로 스크롤
          setTimeout(() => {
            scrollToComment(commentId.toString());
          }, 1000);
        }
      } catch (error) {
        console.error("댓글 페이지를 찾는 중 오류 발생:", error);
        // 오류 발생 시 현재 페이지에서 스크롤 시도
        setTimeout(() => {
          scrollToComment(commentId.toString());
        }, 1000);
      }
    },
    [currentPage, viewCount, scrollToComment, storyId, setCurrentPage]
  );

  // URL 해시에서 댓글 ID 추출 및 스크롤 처리
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#comment-")) {
      const commentId = hash.replace("#comment-", "");
      // 먼저 해당 댓글이 포함된 페이지를 찾아서 이동
      findAndNavigateToCommentPage(parseInt(commentId));
    }
  }, [findAndNavigateToCommentPage]);

  // 페이지 변경 후 해시 스크롤 처리
  useEffect(() => {
    if (CommentData) {
      // 페이지 변경 후 해시가 있다면 해당 댓글로 스크롤
      const hash = window.location.hash;
      if (hash.startsWith("#comment-")) {
        const commentId = hash.replace("#comment-", "");
        setTimeout(() => {
          scrollToComment(commentId);
        }, 500);
      }
    }
  }, [CommentData, scrollToComment]);

  return {
    scrollToComment,
    findAndNavigateToCommentPage,
  };
};
