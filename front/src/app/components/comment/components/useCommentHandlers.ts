import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMessage } from "@/app/store/messageStore";
import { AdminDeleteDialog } from "./types";

interface UseCommentHandlersProps {
  storyId: string;
  sessionUserId?: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  content: string;
  setContent: (content: string) => void;
  setReplyTo: (replyTo: number | null) => void;
  viewCount: number;
  refetch: () => Promise<any>;
}

export const useCommentHandlers = ({
  storyId,
  sessionUserId,
  currentPage,
  setCurrentPage,
  content,
  setContent,
  setReplyTo,
  viewCount,
  refetch,
}: UseCommentHandlersProps) => {
  const { showMessage } = useMessage((state) => state);
  const queryClient = useQueryClient();

  // 삭제 관련 상태
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

  // 관리자 삭제 확인 다이얼로그 상태
  const [adminDeleteDialog, setAdminDeleteDialog] = useState<AdminDeleteDialog>({
    open: false,
    commentId: null,
    content: "",
  });

  // 댓글 POST mutation
  const mutation = useMutation({
    mutationFn: async ({
      storyId,
      content,
      parentId,
      authorId,
    }: {
      storyId: string;
      content: string;
      parentId: number | null;
      authorId: string;
    }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/comment/${storyId}`,
        { storyId, content, parentId, authorId },
        { withCredentials: true }
      );
      return response.data; // commentId를 포함한 데이터 반환
    },
    onSuccess: async (data) => {
      setContent("");

      // 새로 생성된 댓글 ID
      const newCommentId = data.commentId;
      console.log("🔥 새로 생성된 댓글 ID:", newCommentId);

      // 현재 페이지 데이터 새로고침
      const result = await refetch();

      if (result.data) {
        const currentPageComments = result.data.processedComments;
        const newTotalCount = result.data.totalCount;
        const lastPage = Math.ceil(newTotalCount / viewCount);

        console.log("📄 현재 페이지:", currentPage);
        console.log("📄 마지막 페이지:", lastPage);
        console.log(
          "📝 현재 페이지 댓글 IDs:",
          currentPageComments.map((c: any) => c.id)
        );
        console.log("📊 전체 댓글 수:", newTotalCount);

        // 새로 생성된 댓글이 현재 페이지에 있는지 확인
        const isNewCommentInCurrentPage = currentPageComments.some((comment: any) => comment.id === newCommentId);

        console.log("✅ 새 댓글이 현재 페이지에 있나?", isNewCommentInCurrentPage);

        if (isNewCommentInCurrentPage) {
          console.log("🏠 현재 페이지 유지");
          // 현재 페이지에 새 댓글이 있으면 현재 페이지 유지
          queryClient.invalidateQueries({
            queryKey: ["story", "detail", "comments", storyId],
          });
        } else {
          console.log("🚀 마지막 페이지로 이동:", lastPage);
          // 현재 페이지에 새 댓글이 없으면 마지막 페이지로 이동
          setCurrentPage(lastPage);
        }
      }
    },
    onError: () => {
      showMessage("댓글 등록 오류가 발생했습니다.", "error");
    },
  });

  // 댓글 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ commentId, storyId }: { commentId: number; storyId: string }) => {
      console.log("댓글 논리 삭제", commentId);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/comment/${commentId}`,
        { storyId },
        {
          withCredentials: true,
        }
      );
      return response.status;
    },
    onSuccess: async (status) => {
      if (status === 200 || status === 201) {
        // 댓글 삭제 후 데이터를 새로고침하여 최신 댓글 수를 확인
        const result = await refetch();

        if (result.data) {
          const newTotalCount = result.data.totalCount;
          const maxPage = Math.ceil(newTotalCount / viewCount) || 1; // 댓글이 없으면 1페이지

          // 현재 페이지가 최대 페이지보다 크면 (현재 페이지가 비어있으면)
          if (currentPage > maxPage) {
            setCurrentPage(maxPage); // 마지막 페이지로 이동
          } else {
            // 현재 페이지에 머물 경우 쿼리 무효화하여 데이터 갱신
            queryClient.invalidateQueries({
              queryKey: ["story", "detail", "comments", storyId],
            });
          }
        }
      }
    },
    onError: () => {
      showMessage("댓글 삭제 오류가 발생했습니다.", "error");
    },
  });

  // 댓글 수정 mutation
  const editMutation = useMutation({
    mutationFn: async ({ commentId, newContent }: { commentId: number; newContent: string }) => {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/comment/${commentId}`,
        { content: newContent },
        { withCredentials: true }
      );
      return response.status;
    },
    onSuccess: (status) => {
      if (status === 200 || status === 201) {
        refetch(); // 수정 성공 후 현재 페이지 다시 로드
      }
    },
    onError: () => {
      showMessage("댓글 수정 오류가 발생했습니다.", "error");
    },
  });

  // 핸들러 함수들
  const handleSubmit = useCallback(() => {
    if (content.trim() && sessionUserId) {
      mutation.mutate({ storyId, content, parentId: null, authorId: sessionUserId });
      setContent("");
    }
  }, [content, mutation, storyId, sessionUserId, setContent]);

  const handleReplySubmit = useCallback(
    (parentId: number, content: string) => {
      if (content.trim() && sessionUserId) {
        mutation.mutate({
          storyId,
          content,
          parentId,
          authorId: sessionUserId,
        });
        setReplyTo(null);
      }
    },
    [mutation, storyId, sessionUserId, setReplyTo]
  );

  const toggleReply = useCallback(
    (commentId: number) => {
      setReplyTo((prev) => (prev === commentId ? null : commentId)); // 같은 ID를 클릭하면 닫히도록
    },
    [setReplyTo]
  );

  const handleDeleteClick = useCallback((commentId: number) => {
    setCommentToDelete(commentId);
    setOpenConfirmDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (commentToDelete !== null) {
      deleteMutation.mutate({ commentId: commentToDelete, storyId });
      setCommentToDelete(null);
      setOpenConfirmDialog(false);
    }
  }, [commentToDelete, deleteMutation, storyId]);

  const cancelDelete = useCallback(() => {
    setCommentToDelete(null);
    setOpenConfirmDialog(false);
  }, []);

  const handleAdminDeleteComment = useCallback((commentId: number, content: string) => {
    setAdminDeleteDialog({
      open: true,
      commentId,
      content,
    });
  }, []);

  const confirmAdminDelete = useCallback(async () => {
    if (!adminDeleteDialog.commentId) return;

    // 일반 삭제 함수 사용 (소프트 삭제로 대댓글 유지)
    deleteMutation.mutate({
      commentId: adminDeleteDialog.commentId,
      storyId,
    });

    setAdminDeleteDialog({ open: false, commentId: null, content: "" });
    showMessage("댓글이 삭제되었습니다.", "success");
  }, [adminDeleteDialog.commentId, deleteMutation, storyId, showMessage]);

  const cancelAdminDelete = useCallback(() => {
    setAdminDeleteDialog({ open: false, commentId: null, content: "" });
  }, []);

  const handleEditSubmit = useCallback(
    (commentId: number, newContent: string) => {
      if (newContent.trim()) {
        editMutation.mutate({ commentId, newContent });
      }
    },
    [editMutation]
  );

  const handlePageClick = useCallback(
    (event: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  return {
    // Mutations
    mutation,
    deleteMutation,
    editMutation,

    // States
    openConfirmDialog,
    adminDeleteDialog,

    // Handlers
    handleSubmit,
    handleReplySubmit,
    toggleReply,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    handleAdminDeleteComment,
    confirmAdminDelete,
    cancelAdminDelete,
    handleEditSubmit,
    handlePageClick,
  };
};
