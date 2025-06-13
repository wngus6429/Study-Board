"use client";
import * as React from "react";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import dayjs from "dayjs";
//! 몇분전 글이 쓰여졌다 등등 활용, 옛날에는 모먼트를 많이썻다함
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { StoryType } from "@/app/types/storyDetailType";

dayjs.extend(relativeTime);

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
  // 홀수 행에 hover 색상
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // 마지막 행의 테두리 제거
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  // 마우스 호버 효과 추가 - 테마에 맞게 수정
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "#ffdef0",
  },
}));
interface CustomizedTablesProps {
  tableData: any;
}

const CustomizedUserTables = ({ tableData }: CustomizedTablesProps): React.ReactNode => {
  const router = useRouter();

  return (
    <>
      <TableContainer component={Paper}>
        <Table
          aria-label="customized table"
          sx={{
            "& .MuiTableCell-root": {
              borderBottom: "none", // 모든 셀의 아래 경계선 제거
            },
          }}
        >
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "120px" }}>채널</StyledTableCell>
              <StyledTableCell sx={{ width: "200px" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "150px", textAlign: "right" }}>등록일</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={3} align="center" sx={{ height: "100px" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6">😊 작성한 게시글이 없습니다</Typography>
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              tableData.map((row: StoryType) => (
                <StyledTableRow
                  key={row.id}
                  onClick={() => {
                    // 현재 페이지 URL을 세션 스토리지에 저장
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("previousMainPageUrl", window.location.href);
                    }
                    // 채널 슬러그가 있는 경우 채널 URL로, 없는 경우 기본 URL로 이동
                    const targetUrl = row.channelSlug
                      ? `/channels/${row.channelSlug}/detail/story/${row.id}`
                      : `/detail/story/${row.id}`;
                    router.push(targetUrl);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <StyledTableCell sx={{ textAlign: "center" }}>
                    {row.channelName ? (
                      <Box
                        sx={{
                          display: "inline-block",
                          bgcolor: "secondary.main",
                          color: "secondary.contrastText",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                        }}
                      >
                        {row.channelName}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </StyledTableCell>
                  <StyledTableCell
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {row.category === "question" && (
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
                    <Typography variant="body1" color="text.primary" noWrap sx={{ flex: 1 }}>
                      {row.title}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "right", fontSize: "0.875rem", color: "text.secondary" }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 0.2,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", lineHeight: 1 }}>
                        {dayjs(row.created_at).format("YYYY.MM.DD")}
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
                        {dayjs(row.created_at).format("HH:mm")}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default CustomizedUserTables;
