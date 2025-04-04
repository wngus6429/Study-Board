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

// dayjs 플러그인 등록 (상대시간 등 필요하면 사용)
dayjs.extend(relativeTime);

// 테이블 셀 스타일
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    height: "60px", // 모든 행의 높이를 일정하게 설정
  },
}));

// 테이블 행 스타일
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  "&:hover": {
    backgroundColor: "#ffdef0",
    transition: "background-color 0.3s ease",
  },
  height: "60px", // 모든 행의 높이를 일정하게 설정
}));

// Suggestion 데이터 타입(예시)
interface SuggestionType {
  id: number;
  title: string;
  content: string;
  nickname: string;
  category: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// 컴포넌트 Props 정의
interface CustomizedSuggestionTableProps {
  tableData: SuggestionType[];
}

// 건의사항 전용 테이블 컴포넌트
export default function CustomizedSuggestionTable({ tableData }: CustomizedSuggestionTableProps) {
  const router = useRouter();

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      <Table aria-label="suggestion table">
        <TableHead>
          <TableRow>
            <StyledTableCell sx={{ width: "100px", textAlign: "center" }}>번호</StyledTableCell>
            <StyledTableCell sx={{ width: "650px" }}>제목</StyledTableCell>
            <StyledTableCell sx={{ width: "180px" }}>작성자</StyledTableCell>
            <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>등록일</StyledTableCell>
            <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>수정일</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.length === 0 ? (
            <StyledTableRow>
              <StyledTableCell colSpan={5} align="center">
                건의 사항 한게 없습니다.
              </StyledTableCell>
            </StyledTableRow>
          ) : (
            tableData.map((row) => (
              <StyledTableRow
                key={row.id}
                onClick={() => router.push(`/suggestionDetail/${row.id}`)}
                sx={{ cursor: "pointer" }}
              >
                {/* 번호 */}
                <StyledTableCell sx={{ textAlign: "center" }}>{row.id}</StyledTableCell>

                {/* 제목 */}
                <StyledTableCell>
                  <Typography variant="body1" color="text.primary" component="span">
                    {row.title}
                  </Typography>
                </StyledTableCell>

                {/* 작성자 */}
                <StyledTableCell>{row.nickname}</StyledTableCell>

                {/* 등록일 */}
                <StyledTableCell sx={{ textAlign: "center" }}>
                  {dayjs(row.created_at).isSame(dayjs(), "day")
                    ? dayjs(row.created_at).format("HH:mm")
                    : dayjs(row.created_at).format("YYYY/MM/DD")}
                </StyledTableCell>

                {/* 수정일 */}
                <StyledTableCell sx={{ textAlign: "center" }}>
                  {dayjs(row.updated_at).isSame(dayjs(), "day")
                    ? dayjs(row.updated_at).format("HH:mm")
                    : dayjs(row.updated_at).format("YYYY/MM/DD")}
                </StyledTableCell>
              </StyledTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
