"use client";
import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Avatar, Alert, Pagination } from "@mui/material";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import Loading from "./Loading";
import ConfirmDialog from "./ConfirmDialog";
import { useMessage } from "@/app/store/messageStore";

interface Comment {
  id: number;
  content: string;
  nickname: string;
  avatarUrl?: string;
  parentId: number | null;
  createdAt: string;
  children: Comment[];
}

const CommentsView = () => {
  // URL 파라미터에서 스토리 ID 가져오기
  const { id: storyId } = useParams() as { id: string }; // 타입 단언 추가
  const { showMessage } = useMessage((state) => state);
  const { data: session, status } = useSession();
  // 댓글 작성 내용
  const [content, setContent] = useState("");
  // 현재 열려 있는 답글 대상 ID 관리
  const [replyTo, setReplyTo] = useState<number | null>(null);
  // 댓글 데이터 상태
  const [comments, setComments] = useState<Comment[]>([]);
  // 유저 데이터 상태
  const [userData, setUserData] = useState<any>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const viewCount = 5; // 한 페이지당 표시할 최상위 댓글 수

  const {
    data: CommentData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["story", "detail", "comments", storyId],
    queryFn: async () => {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/comment/${storyId}`, {
        userId: session?.user?.id || null, // 로그인했으면 userId 전달, 아니면 null
      });
      console.log("댓글 데이터 받아옴", storyId);
      return response.data;
    },
    enabled: !!storyId && status !== "loading", // storyId가 있으면 항상 활성화
    staleTime: 0, // 페이지 들어갈 때마다 데이터 다시 부름
    // refetchInterval: 1000, // 1초마다 데이터를 다시 가져옴
  });

  // 댓글 데이터 업데이트 시, 페이지 번호 유지 (필요시 조정)
  useEffect(() => {
    if (CommentData?.processedComments) {
      setComments(CommentData.processedComments);
      setUserData(CommentData.loginUser);
      // 전체 페이지 수 계산 (최소 1페이지로 보장, 이거 안하면 첫댓글시, 작성후 바로 반영 안됨)
      const totalPages = Math.max(1, Math.ceil(CommentData.processedComments.length / viewCount));
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }
  }, [CommentData, currentPage, viewCount]);

  // 댓글 POST
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
      return response.status;
    },
    onSuccess: (status) => {
      if (status === 200 || status === 201) {
        setContent("");
        refetch();
      }
    },
    onError: () => {
      showMessage("댓글 등록 오류가 발생했습니다.", "error");
    },
  });

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
    onSuccess: (status) => {
      if (status === 200 || status === 201) {
        refetch();
      }
    },
    onError: () => {
      showMessage("댓글 삭제 오류가 발생했습니다.", "error");
    },
  });

  // 댓글 수정 mutation (PATCH나 PUT을 사용 가능)
  const editMutation = useMutation({
    mutationFn: async ({ commentId, newContent }: { commentId: number; newContent: string }) => {
      // 여기서는 PATCH 메서드를 사용하여 부분 업데이트
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/comment/${commentId}`,
        { content: newContent },
        { withCredentials: true }
      );
      return response.status;
    },
    onSuccess: (status) => {
      if (status === 200 || status === 201) {
        refetch();
      }
    },
    onError: () => {
      showMessage("댓글 수정 오류가 발생했습니다.", "error");
    },
  });

  const handleSubmit = () => {
    if (content.trim()) {
      mutation.mutate({ storyId, content, parentId: null, authorId: session?.user.id as string });
      setContent("");
    }
  };

  const handleReplySubmit = (parentId: number, content: string) => {
    if (content.trim()) {
      mutation.mutate({ storyId, content, parentId, authorId: session?.user.id as string });
      setReplyTo(null);
    }
  };

  const toggleReply = (commentId: number) => {
    setReplyTo((prev) => (prev === commentId ? null : commentId)); // 같은 ID를 클릭하면 닫히도록
  };

  const flattenComments = (comments: any[], depth = 0, result = []) => {
    for (const comment of comments) {
      result.push({ ...comment, depth }); // 댓글과 depth를 함께 저장
      if (comment.children && comment.children.length > 0) {
        flattenComments(comment.children, depth + 1, result); // 재귀 호출
      }
    }
    return result;
  };

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);

  const handleDeleteClick = (commentId: number) => {
    setCommentToDelete(commentId);
    setOpenConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (commentToDelete !== null) {
      deleteMutation.mutate({ commentId: commentToDelete, storyId });
      setCommentToDelete(null);
      setOpenConfirmDialog(false);
    }
  };

  const cancelDelete = () => {
    setCommentToDelete(null);
    setOpenConfirmDialog(false);
  };

  const handleEditSubmit = (commentId: number, newContent: string) => {
    if (newContent.trim()) {
      editMutation.mutate({ commentId, newContent });
    }
  };

  const total = comments.length;
  const startIndex = (currentPage - 1) * viewCount;
  const endIndex = startIndex + viewCount;
  const paginatedComments = comments.slice(startIndex, endIndex);

  const handlePageClick = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const MAX_DEPTH = 4; // 댓글 최대 깊이 제한

  const CommentList = ({
    comments,
    toggleReply,
    handleReplySubmit,
    replyTo,
    handleEditSubmit,
  }: {
    comments: any;
    toggleReply: (commentId: number) => void;
    handleReplySubmit: (parentId: number, content: string) => void;
    replyTo: number | null;
    handleEditSubmit: (commentId: number, newContent: string) => void;
  }) => {
    const [localReplyContent, setLocalReplyContent] = useState("");
    const [editCommentId, setEditCommentId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState<string>("");

    const flatComments = flattenComments(comments);

    return (
      <Box>
        {flatComments.map((comment: any) => (
          <Box
            key={comment.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              border: "1px solid #ddd",
              ml: `${Math.min(comment.depth, MAX_DEPTH) * 30}px`,
              p: 1,
              mb: 1,
            }}
          >
            {/* 댓글 헤더 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#e6e6ff",
                p: 0.5,
              }}
            >
              <Avatar
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${comment.link}`}
                sx={{ width: 32, height: 32, mr: 1 }}
              />
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {comment.nickname}
              </Typography>
              <Typography variant="caption" sx={{ ml: "auto", color: "gray" }}>
                {dayjs(comment.updated_at).format("YYYY-MM-DD HH:mm:ss")}
              </Typography>
            </Box>

            {/* 댓글 내용 또는 수정 모드 입력 */}
            {editCommentId === comment.id ? (
              <Box sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="댓글 수정..."
                  size="small"
                />
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      handleEditSubmit(comment.id, editContent);
                      setEditCommentId(null);
                      setEditContent("");
                    }}
                  >
                    저장
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditCommentId(null);
                      setEditContent("");
                    }}
                  >
                    취소
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ mt: 1 }}>
                {comment.parentNickname && (
                  <Box
                    component="span"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "#FFEB3B",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      mr: 1,
                    }}
                  >
                    @{comment.parentNickname}
                  </Box>
                )}
                {comment.content}
              </Typography>
            )}

            {/* 액션 버튼 (답글, 수정, 삭제) */}
            {comment.nickname != null && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                {session?.user.id && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => toggleReply(comment.id)}
                    color="primary"
                    sx={{ textTransform: "none" }}
                  >
                    답글
                  </Button>
                )}
                {/* 로그인 상태이고 댓글 작성자일 때 수정, 삭제 버튼 표시 */}
                {comment.userId === session?.user.id && (
                  <>
                    {editCommentId !== comment.id && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditCommentId(comment.id);
                          setEditContent(comment.content);
                        }}
                        color="secondary"
                        sx={{ textTransform: "none", ml: 1 }}
                      >
                        수정
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => handleDeleteClick(comment.id)}
                      variant="outlined"
                      color="error"
                      sx={{ textTransform: "none", ml: 1 }}
                    >
                      삭제
                    </Button>
                  </>
                )}
              </Box>
            )}

            {/* 답글 입력창 */}
            {replyTo === comment.id && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  value={localReplyContent}
                  onChange={(e) => setLocalReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  size="small"
                />
                <Button
                  onClick={() => {
                    handleReplySubmit(comment.id, localReplyContent);
                    setLocalReplyContent("");
                  }}
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  댓글 작성
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", border: "1px solid #ddd", padding: 2, mt: 2, mb: 2 }}>
      {isLoading && <Loading />}
      {isError && <Alert severity="error">댓글을 불러오는 중 에러가 발생했습니다. 잠시 후 다시 시도해주세요.</Alert>}
      {openConfirmDialog && (
        <ConfirmDialog
          open={openConfirmDialog}
          title="댓글 삭제"
          description="댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
      <Typography variant="h6" gutterBottom>
        댓글
      </Typography>
      {comments.length === 0 && !isLoading && (
        <Box sx={{ textAlign: "center", padding: 2 }}>
          <Typography variant="body1" color="textSecondary">
            아직 댓글이 없습니다.
            <br />첫 번째 댓글을 작성해보세요!
          </Typography>
        </Box>
      )}
      <CommentList
        comments={paginatedComments}
        toggleReply={toggleReply}
        handleReplySubmit={handleReplySubmit}
        replyTo={replyTo}
        handleEditSubmit={handleEditSubmit}
      />
      {userData?.nickname && (
        <Box
          sx={{
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            {userData.image && (
              <Avatar
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${userData?.image}`}
                sx={{ width: 40, height: 40, marginRight: 1 }}
              />
            )}
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {userData.nickname}
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            placeholder="나쁜말 쓰면 큰일남"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ marginBottom: 1 }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: "gray", marginBottom: 2 }}>
              내 마음에 안들면 댓글 삭제
            </Typography>
            <button
              onClick={handleSubmit}
              style={{
                backgroundColor: "#007BFF",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              댓글 작성
            </button>
          </Box>
        </Box>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", flex: 1, mt: 2 }}>
        <Pagination count={Math.ceil(total / viewCount)} page={currentPage} onChange={handlePageClick} />
      </Box>
    </Box>
  );
};

export default CommentsView;
