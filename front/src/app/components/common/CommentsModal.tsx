"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";

type CommentType = {
  id: number;
  nickname: string;
  content: string;
  createdAt: string;
  replies?: CommentType[];
};

const sampleComments: CommentType[] = [
  {
    id: 1,
    nickname: "user1",
    content: "첫 번째 댓글입니다.",
    createdAt: "2024-11-22T10:00:00",
    replies: [
      {
        id: 11,
        nickname: "user2",
        content: "첫 번째 댓글에 대한 대댓글입니다.",
        createdAt: "2024-11-22T11:00:00",
      },
    ],
  },
  {
    id: 2,
    nickname: "user3",
    content: "두 번째 댓글입니다.",
    createdAt: "2024-11-22T12:00:00",
  },
];

export default function CommentsModal({
  commentModalOpen,
  setCommentModalOpen,
}: {
  commentModalOpen: boolean;
  setCommentModalOpen: (open: boolean) => void;
}) {
  const [comments, setComments] = useState<CommentType[]>(sampleComments);
  const [newComment, setNewComment] = useState("");
  const [newReply, setNewReply] = useState<{ parentId: number | null; content: string }>({
    parentId: null,
    content: "",
  });

  const handleAddComment = () => {
    const newCommentData: CommentType = {
      id: Date.now(),
      nickname: "current_user", // Replace with actual user nickname
      content: newComment,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newCommentData]);
    setNewComment("");
  };

  const handleAddReply = (parentId: number) => {
    const newReplyData: CommentType = {
      id: Date.now(),
      nickname: "current_user", // Replace with actual user nickname
      content: newReply.content,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: comment.replies ? [...comment.replies, newReplyData] : [newReplyData],
            }
          : comment
      )
    );
    setNewReply({ parentId: null, content: "" });
  };

  console.log("commentModalOpen", commentModalOpen);

  return (
    <Dialog open={commentModalOpen} onClose={() => setCommentModalOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>댓글</DialogTitle>
      <DialogContent>
        <List>
          {comments.map((comment) => (
            <Box key={comment.id} sx={{ marginBottom: 2 }}>
              {/* 댓글 */}
              <ListItem>
                <ListItemText
                  primary={`${comment.nickname} (${dayjs(comment.createdAt).format("YYYY/MM/DD HH:mm")})`}
                  secondary={comment.content}
                />
              </ListItem>
              {/* 대댓글 */}
              {comment.replies?.map((reply) => (
                <ListItem key={reply.id} sx={{ paddingLeft: 4 }}>
                  <ListItemText
                    primary={`${reply.nickname} (${dayjs(reply.createdAt).format("YYYY/MM/DD HH:mm")})`}
                    secondary={reply.content}
                  />
                </ListItem>
              ))}
              {/* 대댓글 작성 */}
              <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 4, marginTop: 1 }}>
                <TextField
                  size="small"
                  placeholder="대댓글 작성"
                  value={newReply.parentId === comment.id ? newReply.content : ""}
                  onChange={(e) => setNewReply({ parentId: comment.id, content: e.target.value })}
                  fullWidth
                  sx={{ marginRight: 1 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!newReply.content}
                >
                  등록
                </Button>
              </Box>
            </Box>
          ))}
        </List>
        {/* 댓글 작성 */}
        <Box sx={{ display: "flex", alignItems: "center", marginTop: 2 }}>
          <TextField
            placeholder="댓글 작성"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            fullWidth
            sx={{ marginRight: 1 }}
          />
          <Button variant="contained" onClick={handleAddComment} disabled={!newComment}>
            등록
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCommentModalOpen(false)} color="error">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
