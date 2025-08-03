"use client";
import React, { useState } from "react";
import { Box, TextField, Button, Typography, Avatar, useTheme } from "@mui/material";
import dayjs from "dayjs";
import BlindWrapper from "../../BlindWrapper";
import { useAdmin } from "../../../hooks/useAdmin";
import { CommentListProps, Comment } from "./types";

const CommentList = React.memo(
  ({
    comments,
    toggleReply,
    handleReplySubmit,
    replyTo,
    handleEditSubmit,
    handleAdminDeleteComment,
    handleDeleteClick,
    sessionUserId,
    channelId,
    channelCreatorId,
    MAX_DEPTH,
  }: CommentListProps) => {
    const [localReplyContent, setLocalReplyContent] = useState("");
    const [editCommentId, setEditCommentId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState<string>("");

    const theme = useTheme();
    const admin = useAdmin(); // 관리자 훅

    return (
      <Box>
        {comments.map((comment: Comment) => (
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
              <Box
                sx={{
                  ml: "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#94a3b8" : "gray",
                  }}
                >
                  {dayjs(comment.updated_at).format("YYYY-MM-DD")}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#94a3b8" : "gray",
                  }}
                >
                  {dayjs(comment.updated_at).format("HH:mm:ss")}
                </Typography>
              </Box>
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
                {comment.userId ? (
                  <BlindWrapper userId={comment.userId} type="comment">
                    {comment.content}
                  </BlindWrapper>
                ) : (
                  comment.content
                )}
              </Typography>
            )}

            {/* 액션 버튼 (답글, 수정, 삭제) */}
            {comment.nickname != null && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                {sessionUserId && (
                  <Button
                    size="small"
                    variant={theme.palette.mode === "dark" ? "contained" : "outlined"}
                    onClick={() => toggleReply(comment.id)}
                    color="primary"
                    sx={{
                      textTransform: "none",
                      ...(theme.palette.mode === "dark" && {
                        background: "linear-gradient(45deg, #3b82f6, #1e40af)",
                        "&:hover": {
                          background: "linear-gradient(45deg, #2563eb, #1d4ed8)",
                        },
                      }),
                    }}
                  >
                    답글
                  </Button>
                )}
                {/* 로그인 상태이고 댓글 작성자일 때 수정 버튼 표시 */}
                {comment.userId === sessionUserId && (
                  <>
                    {editCommentId !== comment.id && (
                      <Button
                        size="small"
                        variant={theme.palette.mode === "dark" ? "contained" : "outlined"}
                        onClick={() => {
                          setEditCommentId(comment.id);
                          setEditContent(comment.content);
                        }}
                        color="secondary"
                        sx={{
                          textTransform: "none",
                          ml: 1,
                          ...(theme.palette.mode === "dark" && {
                            background: "linear-gradient(45deg, #8b5cf6, #7c3aed)",
                            "&:hover": {
                              background: "linear-gradient(45deg, #7c3aed, #6d28d9)",
                            },
                          }),
                        }}
                      >
                        수정
                      </Button>
                    )}
                  </>
                )}
                {/* 삭제 버튼 - 본인 댓글이거나 관리자 권한이 있을 때 표시 */}
                {(comment.userId === sessionUserId ||
                  admin.hasAdminPermission({ channelId, creatorId: channelCreatorId })) && (
                  <Button
                    size="small"
                    onClick={() => {
                      // 관리자 권한이 있으면 관리자 삭제, 아니면 일반 삭제
                      if (admin.hasAdminPermission({ channelId, creatorId: channelCreatorId })) {
                        handleAdminDeleteComment(comment.id, comment.content);
                      } else {
                        handleDeleteClick(comment.id);
                      }
                    }}
                    variant={theme.palette.mode === "dark" ? "contained" : "outlined"}
                    color="error"
                    sx={{
                      textTransform: "none",
                      ml: 1,
                      ...(theme.palette.mode === "dark" && {
                        background: "linear-gradient(45deg, #ef4444, #dc2626)",
                        "&:hover": {
                          background: "linear-gradient(45deg, #dc2626, #b91c1c)",
                        },
                      }),
                    }}
                    disabled={admin.isLoading}
                  >
                    {admin.hasAdminPermission({ channelId, creatorId: channelCreatorId }) ? "관리자 삭제" : "삭제"}
                  </Button>
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
                  sx={{
                    mt: 1,
                    ...(theme.palette.mode === "dark" && {
                      background: "linear-gradient(45deg, #10b981, #059669)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #059669, #047857)",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                        transform: "translateY(-1px)",
                      },
                    }),
                  }}
                >
                  댓글 작성
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  }
);

CommentList.displayName = "CommentList";

export default CommentList;
