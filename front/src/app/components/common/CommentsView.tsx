"use client";
import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Avatar, Alert, Pagination, useTheme } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import Loading from "./Loading";
import ConfirmDialog from "./ConfirmDialog";
import { useMessage } from "@/app/store/messageStore";
import { COMMENT_VIEW_COUNT } from "@/app/const/VIEW_COUNT";

interface Comment {
  id: number;
  content: string;
  nickname: string;
  avatarUrl?: string;
  parentId: number | null;
  createdAt: string;
  children: Comment[];
  depth?: number;
}

// 페이지네이션 응답 인터페이스 수정
interface CommentResponse {
  processedComments: Comment[];
  loginUser: any;
  totalCount: number; // 전체 댓글 수 추가 (대댓글 포함)
}

const CommentsView = () => {
  // URL 파라미터에서 스토리 ID 가져오기
  const { id: storyId } = useParams() as { id: string }; // 타입 단언 추가
  const { showMessage } = useMessage((state) => state);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient(); // queryClient 추가
  const theme = useTheme();
  // 댓글 작성 내용
  const [content, setContent] = useState("");
  // 현재 열려 있는 답글 대상 ID 관리
  const [replyTo, setReplyTo] = useState<number | null>(null);
  // 댓글 데이터 상태
  const [comments, setComments] = useState<Comment[]>([]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const viewCount = COMMENT_VIEW_COUNT; // 한 페이지당 표시할 댓글 수
  const [totalCount, setTotalCount] = useState(0); // 전체 댓글 수 상태 추가

  // URL 해시에서 댓글 ID 추출 및 스크롤 처리
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#comment-")) {
      const commentId = hash.replace("#comment-", "");
      // 먼저 해당 댓글이 포함된 페이지를 찾아서 이동
      findAndNavigateToCommentPage(parseInt(commentId));
    }
  }, []);

  // 댓글이 포함된 페이지를 찾아서 이동하는 함수
  const findAndNavigateToCommentPage = async (commentId: number) => {
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
  };

  // 특정 댓글로 스크롤하는 함수
  const scrollToComment = (commentId: string) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // 댓글 하이라이트 효과
      element.style.backgroundColor = "#fff3cd";
      element.style.border = "2px solid #ffc107";
      setTimeout(() => {
        element.style.backgroundColor = "";
        element.style.border = "";
      }, 3000);
    }
  };

  const {
    data: CommentData,
    isLoading,
    isError,
    refetch,
  } = useQuery<CommentResponse>({
    queryKey: ["story", "detail", "comments", storyId, currentPage, viewCount], // 페이지 정보를 쿼리 키에 추가
    queryFn: async () => {
      // 서버에 현재 페이지와 페이지당 댓글 수 정보를 함께 전달
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/comment/${storyId}`, {
        page: currentPage, // 현재 페이지 정보 전달
        limit: viewCount, // 페이지당 표시할 댓글 수 전달 (대댓글 포함)
      });
      console.log("댓글 데이터 받아옴", storyId, "페이지:", currentPage);
      return response.data;
    },
    enabled: !!storyId && status !== "loading", // storyId가 있으면 항상 활성화
  });

  // 댓글 데이터 업데이트 시 상태 업데이트
  useEffect(() => {
    if (CommentData) {
      setComments(CommentData.processedComments); // 평탄화된 댓글을 직접 사용
      setTotalCount(CommentData.totalCount); // 전체 댓글 수 업데이트

      // 페이지 변경 후 해시가 있다면 해당 댓글로 스크롤
      const hash = window.location.hash;
      if (hash.startsWith("#comment-")) {
        const commentId = hash.replace("#comment-", "");
        setTimeout(() => {
          scrollToComment(commentId);
        }, 500);
      }
    }
  }, [CommentData]);

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
          currentPageComments.map((c) => c.id)
        );
        console.log("📊 전체 댓글 수:", newTotalCount);

        // 새로 생성된 댓글이 현재 페이지에 있는지 확인
        const isNewCommentInCurrentPage = currentPageComments.some((comment) => comment.id === newCommentId);

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

  const handleSubmit = () => {
    if (content.trim()) {
      mutation.mutate({ storyId, content, parentId: null, authorId: session?.user.id as string });
      setContent("");
    }
  };

  const handleReplySubmit = (parentId: number, content: string) => {
    if (content.trim()) {
      mutation.mutate({
        storyId,
        content,
        parentId,
        authorId: session?.user.id as string,
      });
      setReplyTo(null);
    }
  };

  const toggleReply = (commentId: number) => {
    setReplyTo((prev) => (prev === commentId ? null : commentId)); // 같은 ID를 클릭하면 닫히도록
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

  // 페이지 변경 시 API 호출
  const handlePageClick = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 자동으로 쿼리가 다시 실행됨 (queryKey에 currentPage가 포함되어 있으므로)
  };

  const MAX_DEPTH = 4; // 댓글 최대 깊이 제한

  const CommentList = ({
    comments,
    toggleReply,
    handleReplySubmit,
    replyTo,
    handleEditSubmit,
  }: {
    comments: Comment[];
    toggleReply: (commentId: number) => void;
    handleReplySubmit: (parentId: number, content: string) => void;
    replyTo: number | null;
    handleEditSubmit: (commentId: number, newContent: string) => void;
  }) => {
    const [localReplyContent, setLocalReplyContent] = useState("");
    const [editCommentId, setEditCommentId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState<string>("");
    const theme = useTheme();

    return (
      <Box>
        {comments.map((comment: any) => (
          <Box
            key={comment.id}
            id={`comment-${comment.id}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid #ddd",
              backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#ffffff",
              ml: `${Math.min(comment.depth || 0, MAX_DEPTH) * 30}px`,
              p: 1,
              mb: 1,
              transition: "all 0.3s ease",
              borderRadius: 2,
              "&:hover": {
                border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid #bbb",
                boxShadow:
                  theme.palette.mode === "dark" ? "0 4px 15px rgba(139, 92, 246, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            {/* 댓글 헤더 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "#e6e6ff",
                p: 0.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Avatar
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${comment.link}`}
                sx={{ width: 32, height: 32, mr: 1 }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#4f46e5",
                }}
              >
                {comment.nickname}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  ml: "auto",
                  color: theme.palette.mode === "dark" ? "#94a3b8" : "gray",
                }}
              >
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
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1e293b",
                  lineHeight: 1.6,
                }}
              >
                {comment.parentNickname && (
                  <Box
                    component="span"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.mode === "dark" ? "rgba(6, 182, 212, 0.8)" : "#FFEB3B",
                      color: theme.palette.mode === "dark" ? "#0f0f23" : "#1e293b",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      mr: 1,
                      fontSize: "0.875rem",
                      boxShadow: theme.palette.mode === "dark" ? "0 0 8px rgba(6, 182, 212, 0.3)" : "none",
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
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: theme.palette.mode === "dark" ? "#a78bfa" : "#1e293b",
          fontWeight: 700,
        }}
      >
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
        comments={comments}
        toggleReply={toggleReply}
        handleReplySubmit={handleReplySubmit}
        replyTo={replyTo}
        handleEditSubmit={handleEditSubmit}
      />
      {session?.user?.id && (
        <Box
          sx={{
            width: "100%",
            border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid #ddd",
            backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.8)" : "#ffffff",
            borderRadius: "8px",
            padding: 2,
            display: "flex",
            flexDirection: "column",
            boxShadow:
              theme.palette.mode === "dark" ? "0 4px 15px rgba(139, 92, 246, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
            {session?.user?.image && (
              <Avatar
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${session?.user?.image}`}
                sx={{ width: 40, height: 40, marginRight: 1 }}
              />
            )}
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                color: theme.palette.mode === "dark" ? "#a78bfa" : "#4f46e5",
              }}
            >
              {session?.user?.nickname}
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
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === "dark" ? "#94a3b8" : "gray",
                marginBottom: 2,
              }}
            >
              내 마음에 안들면 댓글 삭제
            </Typography>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                background:
                  theme.palette.mode === "dark" ? "linear-gradient(45deg, #8b5cf6 30%, #06b6d4 90%)" : "#007BFF",
                color: "white",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                "&:hover": {
                  background:
                    theme.palette.mode === "dark" ? "linear-gradient(45deg, #7c3aed 30%, #0891b2 90%)" : "#0056b3",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 6px 20px rgba(139, 92, 246, 0.4)"
                      : "0 4px 12px rgba(0, 123, 255, 0.3)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              댓글 작성
            </Button>
          </Box>
        </Box>
      )}
      {session?.user?.id && !session?.user?.nickname && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="error">
            댓글 작성을 위한, 로그인 정보를 가져오는 중 문제가 발생했습니다.
          </Typography>
          <Button variant="outlined" color="primary" onClick={() => refetch()} sx={{ mt: 1 }}>
            다시 시도
          </Button>
        </Box>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", flex: 1, mt: 2 }}>
        {/* 서버에서 받아온, 전체 댓글 수(대댓글 포함)를 기반으로 페이지네이션 표시 */}
        <Pagination count={Math.ceil(totalCount / viewCount)} page={currentPage} onChange={handlePageClick} />
      </Box>
    </Box>
  );
};

export default CommentsView;
