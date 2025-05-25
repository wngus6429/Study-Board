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
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";

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
  // 마우스 호버 효과 추가
  "&:hover": {
    backgroundColor: "#ffdef0",
  },
}));

interface CustomizedTablesProps {
  tableData: any;
  commentsFlag: boolean;
}

interface CustomizedUserTablesDataProps {
  id: number;
  content: string;
  updated_at: string;
  storyId: number;
}

const CustomizedUserTables = ({ tableData, commentsFlag }: CustomizedTablesProps): React.ReactNode => {
  const router = useRouter();
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      {/* 모든 셀의 borderBottom을 제거 */}
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
            <StyledTableCell sx={{ width: "200px" }}>제목</StyledTableCell>
            <StyledTableCell sx={{ width: "170px", textAlign: "right" }}>등록일</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.length === 0 ? (
            <StyledTableRow>
              <StyledTableCell colSpan={2} align="center" sx={{ height: "100px" }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6">
                    {commentsFlag ? "😊 작성한 댓글이 없습니다" : "😊 작성한 게시글이 없습니다"}
                  </Typography>
                </Box>
              </StyledTableCell>
            </StyledTableRow>
          ) : (
            tableData.map((row: CustomizedUserTablesDataProps) => (
              <StyledTableRow
                key={row.id}
                onClick={() => {
                  // 댓글 클릭 시 해당 댓글로 이동 (내 프로필, 상대방 프로필 모두)
                  if (row.storyId) {
                    // 상대방 프로필에서만 현재 페이지 URL을 세션 스토리지에 저장
                    if (typeof window !== "undefined" && commentsFlag) {
                      sessionStorage.setItem("previousMainPageUrl", window.location.href);
                    }
                    router.push(`/detail/story/${row.storyId}#comment-${row.id}`);
                  } else {
                    console.warn("storyId가 없습니다:", row);
                  }
                }}
                sx={{
                  cursor: row.storyId ? "pointer" : "default",
                  opacity: row.storyId ? 1 : 0.6,
                }}
              >
                <StyledTableCell
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography variant="body1" color="text.primary" noWrap>
                    {row.content}
                  </Typography>
                  {!row.storyId && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      (삭제된 글)
                    </Typography>
                  )}
                </StyledTableCell>
                <StyledTableCell sx={{ textAlign: "right", fontSize: "0.875rem", color: "text.secondary" }}>
                  {dayjs(row.updated_at).format("YYYY.MM.DD HH:mm")}
                </StyledTableCell>
              </StyledTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomizedUserTables;
