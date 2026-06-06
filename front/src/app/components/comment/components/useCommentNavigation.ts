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
  const highlightComment = useCallback((element: HTMLElement) => {
    element.style.backgroundColor = "rgba(250, 204, 21, 0.22)";
    element.style.border = "3px solid #facc15";
    element.style.boxShadow = "0 0 0 4px rgba(250, 204, 21, 0.18)";

    window.setTimeout(() => {
      element.style.backgroundColor = "";
      element.style.border = "";
      element.style.boxShadow = "";
    }, 2400);
  }, []);

  // 댓글 DOM이 준비되는 즉시 찾아 스크롤과 하이라이트를 적용합니다.
  const scrollToComment = useCallback((commentId: string) => {
    const tryScroll = (remainingAttempts: number) => {
      const element = document.getElementById(`comment-${commentId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        highlightComment(element);
        return;
      }

      if (remainingAttempts > 0) {
        window.setTimeout(() => tryScroll(remainingAttempts - 1), 80);
      }
    };

    requestAnimationFrame(() => tryScroll(12));
  }, [highlightComment]);

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
        } else {
          scrollToComment(commentId.toString());
        }
      } catch (error) {
        console.error("댓글 페이지를 찾는 중 오류 발생:", error);
        scrollToComment(commentId.toString());
      }
    },
    [currentPage, viewCount, scrollToComment, storyId, setCurrentPage]
  );

  // URL 해시에서 댓글 ID 추출 및 스크롤 처리
  useEffect(() => {
    const navigateFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#comment-")) {
        const commentId = hash.replace("#comment-", "");
        findAndNavigateToCommentPage(parseInt(commentId));
      }
    };

    navigateFromHash();
    window.addEventListener("hashchange", navigateFromHash);

    return () => {
      window.removeEventListener("hashchange", navigateFromHash);
    };
  }, [findAndNavigateToCommentPage]);

  // 페이지 변경 후 해시 스크롤 처리
  useEffect(() => {
    if (CommentData) {
      // 페이지 변경 후 해시가 있다면 해당 댓글로 스크롤
      const hash = window.location.hash;
      if (hash.startsWith("#comment-")) {
        const commentId = hash.replace("#comment-", "");
        scrollToComment(commentId);
      }
    }
  }, [CommentData, scrollToComment]);

  return {
    scrollToComment,
    findAndNavigateToCommentPage,
  };
};
