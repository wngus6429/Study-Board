"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Box, TextField, Button, Typography, Avatar } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useComment, useUserImage } from "@/app/store";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";

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

const postComment = async ({
  storyId,
  content,
  parentId,
  nickname,
}: {
  storyId: number;
  content: string;
  parentId: number | null;
  nickname: string;
}) => {
  const response = await axios.post("/api/comments", {
    // storyId,
    content,
    parentId,
    nickname,
  });
  return response.data;
};

const CommentsView = () => {
  const { id: storyId } = useParams() as { id: string }; // 타입 단언 추가
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const defaultComments: Comment[] = [
    {
      id: 1,
      content: "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ",
      nickname: "메롱",
      avatarUrl: "https://via.placeholder.com/40", // 기본 이미지 URL
      parentId: null,
      createdAt: "2024-11-24T16:23:59",
      children: [
        {
          id: 2,
          content: "😂 아울베어 그림 추가",
          nickname: "아울베어",
          avatarUrl: "https://via.placeholder.com/40",
          parentId: 1,
          createdAt: "2024-11-24T16:25:59",
          children: [],
        },
        {
          id: 3,
          content: "😂 아울베어 그림 추가",
          nickname: "아울베어",
          avatarUrl: "https://via.placeholder.com/40",
          parentId: 1,
          createdAt: "2024-11-24T16:25:59",
          children: [],
        },
      ],
    },
  ];

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
    onSuccess: (createdComment) => {
      // 새 댓글을 로컬 상태에 추가
      setComments((prevComments): any => [
        ...prevComments,
        {
          id: createdComment.id,
          content: createdComment.content,
          created_at: createdComment.created_at,
          updated_at: createdComment.updated_at,
          nickname: createdComment.nickname,
          avatarUrl: createdComment.avatarUrl,
          parentId: createdComment.parentId,
          children: [],
        },
      ]);
      setContent(""); // 입력 필드 초기화
      // 캐시 갱신 안하면 뒤로가기 했다가 다시 들어오면 방금 적은 댓글이 안보임
      queryClient.invalidateQueries({ queryKey: ["story", "detail", storyId] });
    },
  });

  const { commentsData, loginCommentInfo } = useComment();
  const [content, setContent] = useState("");
  const [authorId, setAuthor] = useState(session?.user.id);
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null); // 현재 열려 있는 답글 대상 ID 관리

  const [comments, setComments] = useState<Comment[]>(commentsData);

  const handleSubmit = () => {
    if (content.trim()) {
      console.log({ storyId, content, parentId: null, authorId: authorId as string });
      mutation.mutate({ storyId, content, parentId: null, authorId: authorId as string });
      setContent("");
    }
  };

  const handleReplySubmit = (parentId: number) => {
    if (replyContent.trim()) {
      mutation.mutate({ storyId, content: replyContent, parentId, authorId: authorId as string });
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const toggleReply = (commentId: number) => {
    setReplyTo((prev) => (prev === commentId ? null : commentId)); // 같은 ID를 클릭하면 닫히도록
  };

  // 댓글 컴포넌트 최적화
  const CommentItem = React.memo(
    ({ comment, toggleReply, handleReplySubmit, replyTo, replyContent, setReplyContent }: any) => {
      return (
        <Box
          key={comment.id}
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
            <Avatar src={comment.avatarUrl} sx={{ width: 32, height: 32, mr: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {comment.nickname}
            </Typography>
            <Typography variant="caption" sx={{ ml: 1, color: "gray" }}>
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
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력하세요..."
                size="small"
              />
              <Button onClick={() => handleReplySubmit(comment.id)} variant="contained" size="small" sx={{ mt: 1 }}>
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
                replyContent={replyContent}
                setReplyContent={setReplyContent}
              />
            ))}
        </Box>
      );
    }
  );

  const memoizedComments = useMemo(() => {
    return comments.map((comment) => (
      <CommentItem
        key={comment.id}
        comment={comment}
        toggleReply={toggleReply}
        handleReplySubmit={() => {}}
        replyTo={replyTo}
        replyContent={replyContent}
        setReplyContent={setReplyContent}
      />
    ));
  }, [comments, replyTo, replyContent]);

  if (!commentsData) return <Typography>로딩 댓글...</Typography>;

  return (
    <Box sx={{ width: "100%", border: "1px solid #ddd", padding: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        댓글
      </Typography>
      {comments && comments.length === 0 && <Typography>댓글이 없습니다.</Typography>}
      {memoizedComments}
      {loginCommentInfo.nickname != null && (
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
            {loginCommentInfo.userImageUrl && (
              <Avatar
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${loginCommentInfo.userImageUrl}`}
                sx={{ width: 40, height: 40, marginRight: 1 }}
              />
            )}
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {loginCommentInfo?.nickname}
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
