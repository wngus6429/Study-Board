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
import { useTheme } from "@mui/material/styles";

// dayjs 플러그인 등록 (상대시간 등 필요하면 사용)
dayjs.extend(relativeTime);

// 테이블 셀 스타일
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : theme.palette.common.black,
    color: theme.palette.common.white,
    fontWeight: 600,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    height: "60px", // 모든 행의 높이를 일정하게 설정
    color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
  },
}));

// 테이블 행 스타일
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.5)" : theme.palette.action.hover,
  },
  "&:nth-of-type(even)": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.3)" : "transparent",
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "#ffdef0",
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
  channelSlug?: string; // 채널 슬러그 추가
}

// 건의사항 전용 테이블 컴포넌트
export default function CustomizedSuggestionTable({ tableData, channelSlug }: CustomizedSuggestionTableProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : 3,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "background.paper",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
        }}
      >
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
                  😎건의 사항 없음
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              tableData.map((row) => (
                <StyledTableRow
                  key={row.id}
                  onClick={() => router.push(`/channels/${channelSlug}/detail/suggestion/${row.id}`)}
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
    </>
  );
}
