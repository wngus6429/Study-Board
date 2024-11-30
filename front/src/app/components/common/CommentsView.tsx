"use client";
import React, { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Avatar } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useComment, useUserImage } from "@/app/store";
import { useSession } from "next-auth/react";

interface Comment {
  id: number;
  content: string;
  author: string; // 작성자 닉네임
  avatarUrl?: string; // 작성자 프로필 이미지 URL
  parentId: number | null;
  createdAt: string;
  children: Comment[];
}

interface CommentsProps {
  storyId?: number;
}

const fetchComments = async (storyId: number) => {
  const response = await axios.get(`/api/comments?storyId=${storyId}`);
  return response.data;
};

const postComment = async ({
  storyId,
  content,
  parentId,
  author,
}: {
  storyId: number;
  content: string;
  parentId: number | null;
  author: string;
}) => {
  const response = await axios.post("/api/comments", {
    storyId,
    content,
    parentId,
    author,
  });
  return response.data;
};

const CommentsView = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const defaultComments: Comment[] = [
    {
      id: 1,
      content: "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ",
      author: "메롱",
      avatarUrl: "https://via.placeholder.com/40", // 기본 이미지 URL
      parentId: null,
      createdAt: "2024-11-24T16:23:59",
      children: [
        {
          id: 2,
          content: "😂 아울베어 그림 추가",
          author: "아울베어",
          avatarUrl: "https://via.placeholder.com/40",
          parentId: 1,
          createdAt: "2024-11-24T16:25:59",
          children: [],
        },
        {
          id: 3,
          content: "😂 아울베어 그림 추가",
          author: "아울베어",
          avatarUrl: "https://via.placeholder.com/40",
          parentId: 1,
          createdAt: "2024-11-24T16:25:59",
          children: [],
        },
      ],
    },
  ];

  const mutation = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", storyId] });
    },
  });

  console.log("session", session?.user);

  const { commentsData, loginCommentInfo } = useComment();
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState(session?.user.nickname);
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null); // 현재 열려 있는 답글 대상 ID 관리

  const [comments, setComments] = useState<Comment[]>(commentsData || defaultComments);

  const handleSubmit = () => {
    if (content.trim()) {
      mutation.mutate({ storyId, content, parentId: null, author });
      setContent("");
    }
  };

  const handleReplySubmit = (parentId: number) => {
    if (replyContent.trim()) {
      mutation.mutate({ storyId, content: replyContent, parentId, author });
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const toggleReply = (commentId: number) => {
    setReplyTo((prev) => (prev === commentId ? null : commentId)); // 같은 ID를 클릭하면 닫히도록
  };

  console.log("loginCommentInfo", loginCommentInfo);

  const renderComments = (comments: Comment[]) =>
    comments.map((comment) => (
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
            {comment.author}
          </Typography>
          <Typography variant="caption" sx={{ ml: 1, color: "gray" }}>
            {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Typography variant="body1">{comment.content}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Button
            size="small"
            onClick={() => toggleReply(comment.id)} // 답글 토글
            sx={{ textTransform: "none" }}
          >
            답글
          </Button>
          <Button size="small" sx={{ textTransform: "none", color: "red" }}>
            신고
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
        {comment.children && renderComments(comment.children)}
      </Box>
    ));

  if (!commentsData) return <Typography>로딩 댓글...</Typography>;

  return (
    <Box sx={{ width: "100%", border: "1px solid #ddd", padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        댓글
      </Typography>
      {comments && comments.length === 0 && <Typography>댓글이 없습니다.</Typography>}
      {renderComments(comments || [])}
      {loginCommentInfo != null && (
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
