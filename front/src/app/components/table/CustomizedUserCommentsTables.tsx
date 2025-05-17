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
                  if (!commentsFlag) {
                    router.push(`/detail/story/${row.storyId}`);
                  }
                }}
                sx={{
                  cursor: commentsFlag ? "default" : "pointer",
                  pointerEvents: commentsFlag ? "none" : "auto", // 클릭 비활성화
                }}
              >
                <StyledTableCell
                  sx={{
                    display: "flex",
                    alignItems: "center", // 세로 방향 가운데 정렬
                    // justifyContent: "center", // 가로 방향도 가운데 정렬하고 싶다면 추가
                    gap: 1,
                    // 테이블 높이가 너무 작다면 아래처럼 최소 높이를 부여
                    // minHeight: 48
                  }}
                >
                  <Typography variant="body1" color="text.primary" noWrap>
                    {row.content}
                  </Typography>
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
