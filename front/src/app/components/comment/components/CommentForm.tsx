"use client";
import React from "react";
import { Box, TextField, Button, Typography, Avatar, useTheme } from "@mui/material";
import { CommentFormProps } from "./types";

const CommentForm: React.FC<CommentFormProps> = ({
  content,
  setContent,
  handleSubmit,
  isLoggedIn,
  sessionUser,
  refetch,
}) => {
  const theme = useTheme();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* 댓글 작성 폼 */}
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
          {sessionUser?.image && (
            <Avatar
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${sessionUser.image}`}
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
            {sessionUser?.nickname}
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

      {/* 로그인 정보 오류 처리 */}
      {!sessionUser?.nickname && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="error">
            댓글 작성을 위한, 로그인 정보를 가져오는 중 문제가 발생했습니다.
          </Typography>
          <Button
            variant={theme.palette.mode === "dark" ? "contained" : "outlined"}
            color="primary"
            onClick={() => refetch()}
            sx={{
              mt: 1,
              ...(theme.palette.mode === "dark" && {
                background: "linear-gradient(45deg, #3b82f6, #1e40af)",
                "&:hover": {
                  background: "linear-gradient(45deg, #2563eb, #1d4ed8)",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transform: "translateY(-1px)",
                },
              }),
            }}
          >
            다시 시도
          </Button>
        </Box>
      )}
    </>
  );
};

export default CommentForm;
