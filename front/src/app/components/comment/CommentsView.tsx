"use client";
import React, { useMemo, useState } from "react";
import { Box, Typography, Alert, useTheme } from "@mui/material";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Loading from "../common/Loading";
import ConfirmDialog from "../common/ConfirmDialog";
import { COMMENT_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import { useAdmin } from "../../hooks/useAdmin";

// 분리된 컴포넌트들과 훅들 import
import { CommentsViewProps, CommentResponse } from "./components/types";
import CommentList from "./components/CommentList";
import CommentForm from "./components/CommentForm";
import CommentPagination from "./components/CommentPagination";
import { useCommentHandlers } from "./components/useCommentHandlers";
import { useCommentNavigation } from "./components/useCommentNavigation";
import { useLanguageStore } from "@/app/store/languageStore";

const CommentsView = ({ channelId, channelCreatorId }: CommentsViewProps = {}) => {
  // URL 파라미터에서 스토리 ID 가져오기
  const { id: storyId } = useParams() as { id: string };
  const { data: session, status } = useSession();
  const theme = useTheme();
  const admin = useAdmin();
  const language = useLanguageStore((state) => state.language);
  const isJapanese = language === "ja";

  // 댓글 작성 내용
  const [content, setContent] = useState("");
  // 현재 열려 있는 답글 대상 ID 관리
  const [replyTo, setReplyTo] = useState<number | null>(null);
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const viewCount = COMMENT_VIEW_COUNT; // 한 페이지당 표시할 댓글 수

  //! 댓글 데이터 가져오기
  const {
    data: CommentData,
    isLoading,
    isError,
    refetch,
  } = useQuery<CommentResponse>({
    queryKey: ["story", "detail", "comments", storyId, currentPage, viewCount],
    queryFn: async () => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/comment/${storyId}`, {
        page: currentPage,
        limit: viewCount,
      });
      console.log("댓글 데이터 받아옴", storyId, "페이지:", currentPage);
      return response.data;
    },
    enabled: !!storyId && status !== "loading",
    placeholderData: keepPreviousData, // 페이지네이션 깜빡임 방지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
  });

  // 댓글 네비게이션 훅 사용
  useCommentNavigation({
    storyId,
    currentPage,
    setCurrentPage,
    viewCount,
    CommentData,
  });

  // 댓글 핸들러 훅 사용
  const {
    openConfirmDialog,
    adminDeleteDialog,
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
  } = useCommentHandlers({
    storyId,
    sessionUserId: session?.user?.id,
    currentPage,
    setCurrentPage,
    content,
    setContent,
    setReplyTo,
    viewCount,
    refetch,
  });

  // 댓글 데이터 메모이제이션 (상태 대신 직접 계산)
  const comments = useMemo(() => {
    return CommentData?.processedComments || [];
  }, [CommentData?.processedComments]);

  const totalCount = useMemo(() => {
    return CommentData?.totalCount || 0;
  }, [CommentData?.totalCount]);

  // 페이지네이션 계산 메모이제이션
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / viewCount) || 1;
  }, [totalCount, viewCount]);

  // 로그인 상태 확인 메모이제이션
  const isLoggedIn = useMemo(() => {
    return !!session?.user?.id;
  }, [session?.user?.id]);

  const MAX_DEPTH = 4; // 댓글 최대 깊이 제한

  return (
    <Box
      sx={{
        width: "100%",
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid #ddd",
        backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.5)" : "#ffffff",
        padding: 2,
        mt: 2,
        mb: 2,
        borderRadius: 3,
        boxShadow:
          theme.palette.mode === "dark" ? "0 4px 20px rgba(139, 92, 246, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 로딩 및 에러 처리 */}
      {isLoading && <Loading />}
      {isError && (
        <Alert severity="error">
          {isJapanese
            ? "コメントの読み込み中にエラーが発生しました。しばらくしてからもう一度お試しください。"
            : "댓글을 불러오는 중 에러가 발생했습니다. 잠시 후 다시 시도해주세요."}
        </Alert>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title={isJapanese ? "コメント削除" : "댓글 삭제"}
          description={
            isJapanese
              ? "コメントを削除しますか？削除されたコメントは復元できません。"
              : "댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다."
          }
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText={isJapanese ? "削除" : "삭제"}
          cancelText={isJapanese ? "キャンセル" : "취소"}
        />
      )}

      {/* 관리자 삭제 확인 다이얼로그 */}
      {adminDeleteDialog.open && (
        <ConfirmDialog
          open={adminDeleteDialog.open}
          title={isJapanese ? "🛡️ 管理者権限でコメント削除" : "🛡️ 관리자 권한으로 댓글 삭제"}
          description={
            isJapanese
              ? `次のコメントを削除しますか？\n\n"${adminDeleteDialog.content}"\n\n⚠️ この操作は取り消せません。`
              : `다음 댓글을 삭제하시겠습니까?\n\n"${adminDeleteDialog.content}"\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`
          }
          onConfirm={confirmAdminDelete}
          onCancel={cancelAdminDelete}
          confirmText={admin.isLoading ? (isJapanese ? "削除中..." : "삭제 중...") : isJapanese ? "削除" : "삭제"}
          cancelText={isJapanese ? "キャンセル" : "취소"}
        />
      )}

      {/* 댓글 제목 */}
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: theme.palette.mode === "dark" ? "#a78bfa" : "#1e293b",
          fontWeight: 700,
          ml: 1,
        }}
      >
        {isJapanese ? "コメント" : "댓글"}
      </Typography>

      {/* 댓글이 없을 때 메시지 */}
      {comments.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", padding: 2 }}>
          <Typography variant="body1" color="textSecondary">
            {isJapanese ? "まだコメントはありません。" : "아직 댓글이 없습니다."}
            <br />
            {isJapanese ? "最初のコメントを投稿してみましょう！" : "첫 번째 댓글을 작성해보세요!"}
          </Typography>
        </Box>
      )}

      {/* 댓글 목록 */}
      <CommentList
        comments={comments}
        toggleReply={toggleReply}
        handleReplySubmit={handleReplySubmit}
        replyTo={replyTo}
        handleEditSubmit={handleEditSubmit}
        handleAdminDeleteComment={handleAdminDeleteComment}
        handleDeleteClick={handleDeleteClick}
        sessionUserId={session?.user?.id}
        channelId={channelId}
        channelCreatorId={channelCreatorId}
        MAX_DEPTH={MAX_DEPTH}
      />

      {/* 댓글 작성 폼 */}
      <CommentForm
        content={content}
        setContent={setContent}
        handleSubmit={handleSubmit}
        isLoggedIn={isLoggedIn}
        sessionUser={{
          image: session?.user?.image || undefined,
          nickname: session?.user?.nickname || undefined,
        }}
        refetch={refetch}
      />

      {/* 페이지네이션 */}
      <CommentPagination totalPages={totalPages} currentPage={currentPage} handlePageClick={handlePageClick} />
    </Box>
  );
};

export default CommentsView;
