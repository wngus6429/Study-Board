"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, TextField, Button, Typography, Avatar, Alert } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useComment, useUserImage } from "@/app/store";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import Loading from "./Loading";

interface Comment {
  id: number;
  content: string;
  nickname: string;
  avatarUrl?: string;
  parentId: number | null;
  createdAt: string;
  children: Comment[];
}

interface CommentsProps {
  storyId?: number;
}

const CommentsView = () => {
  // URL 파라미터에서 스토리 ID 가져오기
  const { id: storyId } = useParams() as { id: string }; // 타입 단언 추가
  // 세션 데이터
  const { data: session, status } = useSession();
  // 댓글 작성 내용
  const [content, setContent] = useState("");
  // 현재 열려 있는 답글 대상 ID 관리
  const [replyTo, setReplyTo] = useState<number | null>(null);
  // 댓글 데이터 상태
  const [comments, setComments] = useState<Comment[]>([]);
  // 유저 데이터 상태
  const [userData, setUserData] = useState<any>(null);

  //! 댓글 데이터 가져오기
  const {
    data: CommentData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["story", "detail", "comments", storyId],
    queryFn: async () => {
      console.log("댓글 데이터 요청", storyId);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/detail/comment/${storyId}`, {
        userId: session?.user?.id, // 로그인 안 한 경우 null 전달
      });
      return response.data;
    },
    // status === "authenticated"는 단순 세션이 검증 끝났다는거
    enabled: !!storyId && status === "authenticated", // storyId만 있으면 쿼리 활성화
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (CommentData?.processedComments) {
      setComments(CommentData.processedComments);
      setUserData(CommentData.loginUser);
    }
  }, [CommentData]);

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
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/story/comment/${storyId}`,
          {
            storyId,
            content,
            parentId,
            authorId,
          },
          { withCredentials: true }
        );
        return response.data;
      } catch (error) {
        throw new Error("Failed to post comment");
      }
    },
    onSuccess: () => {
      setContent("");
      refetch();
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
      mutation.mutate({ storyId, content: content, parentId, authorId: session?.user.id as string });
      setReplyTo(null);
    }
  };

  const toggleReply = (commentId: number) => {
    setReplyTo((prev) => (prev === commentId ? null : commentId)); // 같은 ID를 클릭하면 닫히도록
  };

  // 댓글 컴포넌트 최적화
  const CommentItem = React.memo(({ comment, toggleReply, handleReplySubmit, replyTo }: any) => {
    const [localReplyContent, setLocalReplyContent] = useState("");

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: 2,
          mt: 2,
          ml: comment.parentId ? 4 : 0,
          backgroundColor: comment.parentId ? "#f9f9f9" : "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Avatar src={`${process.env.NEXT_PUBLIC_BASE_URL}${comment.link}`} sx={{ width: 32, height: 32, mr: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {comment.nickname}
          </Typography>
          <Typography variant="caption" sx={{ ml: "auto", color: "gray" }}>
            {dayjs(comment.updated_at).format("YYYY-MM-DD HH:mm:ss")}
          </Typography>
        </Box>
        <Typography variant="body1">{comment.content}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Button size="small" onClick={() => toggleReply(comment.id)} sx={{ textTransform: "none" }}>
            답글
          </Button>
        </Box>
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
        {comment.children &&
          comment.children.map((child: any) => (
            <CommentItem
              key={child.id}
              comment={child}
              toggleReply={toggleReply}
              handleReplySubmit={handleReplySubmit}
              replyTo={replyTo}
            />
          ))}
      </Box>
    );
  });

  const memoizedComments = useMemo(() => {
    return comments.map((comment: any, index) => (
      <CommentItem
        key={comment.id}
        comment={comment}
        toggleReply={toggleReply}
        handleReplySubmit={handleReplySubmit}
        replyTo={replyTo}
      />
    ));
  }, [comments, replyTo]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <Box sx={{ width: "100%", padding: 2, mt: 2 }}>
        <Alert severity="error">댓글을 불러오는 중 에러가 발생했습니다. 잠시 후 다시 시도해주세요.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", border: "1px solid #ddd", padding: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        댓글
      </Typography>
      {CommentData && comments.length === 0 && <Typography>댓글이 없습니다.</Typography>}
      {memoizedComments}
      {userData?.nickname != null && (
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
            placeholder="댓글을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ marginBottom: 1 }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: "gray", marginBottom: 2 }}>
              내 마음에 안들면 댓글 삭제 할 거임
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
    </Box>
  );
};

export default CommentsView;
