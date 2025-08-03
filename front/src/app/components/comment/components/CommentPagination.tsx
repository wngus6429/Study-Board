"use client";
import React from "react";
import { Box, Pagination, useTheme } from "@mui/material";
import { CommentPaginationProps } from "./types";

const CommentPagination: React.FC<CommentPaginationProps> = ({ totalPages, currentPage, handlePageClick }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", flex: 1, mt: 2 }}>
      {/* 서버에서 받아온, 전체 댓글 수(대댓글 포함)를 기반으로 페이지네이션 표시 */}
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageClick}
        sx={{
          "& .MuiPaginationItem-root": {
            color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
            borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "#d1d5db",
            backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.6)" : "#f9fafb",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "#e5e7eb",
              borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#9ca3af",
            },
            "&.Mui-selected": {
              backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#3b82f6",
              color: "#ffffff",
              borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 1)" : "#3b82f6",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.9)" : "#2563eb",
              },
            },
            "&.MuiPaginationItem-previousNext": {
              color: theme.palette.mode === "dark" ? "#a78bfa" : "#4f46e5",
              fontWeight: 600,
            },
          },
        }}
      />
    </Box>
  );
};

export default CommentPagination;
