"use client";
import React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Box, Typography, Button, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { RecentViewItem, useRecentViews } from "@/app/store/recentViewsStore";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "#ffdef0",
  },
}));

export default function RecentViewsPage() {
  const router = useRouter();
  const { recentViews, clearRecentViews } = useRecentViews();

  const handleClearAll = () => {
    if (window.confirm("모든 최근 본 게시물을 삭제하시겠습니까?")) {
      clearRecentViews();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          최근에 봤던 게시물
        </Typography>
        {recentViews.length > 0 && (
          <Button variant="outlined" color="error" onClick={handleClearAll}>
            전체 삭제
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table
          aria-label="recent views table"
          sx={{
            "& .MuiTableCell-root": {
              borderBottom: "none",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "50%" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "15%", textAlign: "center" }}>카테고리</StyledTableCell>
              <StyledTableCell sx={{ width: "17.5%", textAlign: "right" }}>작성일</StyledTableCell>
              <StyledTableCell sx={{ width: "17.5%", textAlign: "right" }}>조회일</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentViews.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={4} align="center" sx={{ height: "200px" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                      📖 최근에 본 게시물이 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      게시물을 클릭하면 여기에 기록됩니다
                    </Typography>
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              recentViews.map((item: RecentViewItem) => (
                <StyledTableRow
                  key={`${item.id}-${item.viewedAt}`}
                  onClick={() => {
                    router.push(`/channels/${item.channelSlug}/detail/story/${item.id}`);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1" color="text.primary" noWrap>
                        {item.title}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>
                    {item.category === "question" && (
                      <Box
                        sx={{
                          display: "inline-block",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          px: 1,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        질문
                      </Box>
                    )}
                    {item.category === "free" && (
                      <Box
                        sx={{
                          display: "inline-block",
                          bgcolor: "success.main",
                          color: "success.contrastText",
                          px: 1,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        자유
                      </Box>
                    )}
                    {item.category === "study" && (
                      <Box
                        sx={{
                          display: "inline-block",
                          bgcolor: "info.main",
                          color: "info.contrastText",
                          px: 1,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        스터디
                      </Box>
                    )}
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "right", fontSize: "0.875rem", color: "text.secondary" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.2 }}>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1 }}>
                        {dayjs(item.created_at).format("YYYY.MM.DD")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.75rem",
                          lineHeight: 1,
                          color: "text.secondary",
                          opacity: 0.8,
                        }}
                      >
                        {dayjs(item.created_at).format("HH:mm")}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "right", fontSize: "0.875rem", color: "text.secondary" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.2 }}>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1 }}>
                        {dayjs(item.viewedAt).format("YYYY.MM.DD")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.75rem",
                          lineHeight: 1,
                          color: "text.secondary",
                          opacity: 0.8,
                        }}
                      >
                        {dayjs(item.viewedAt).format("HH:mm")}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {recentViews.length > 0 && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {`총 ${recentViews.length}개의 게시물 (최대 30개까지 저장됩니다)`}
          </Typography>
        </Box>
      )}
    </Container>
  );
}
