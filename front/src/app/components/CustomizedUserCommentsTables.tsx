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
import { StoryType } from "../types/types";
import dayjs from "dayjs";
//! 몇분전 글이 쓰여졌다 등등 활용, 옛날에는 모먼트를 많이썻다함
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
  console.log(tableData);
  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "200px" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "80px", textAlign: "right" }}>등록일</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row: CustomizedUserTablesDataProps) => (
              <StyledTableRow
                key={row.id}
                onClick={() => {
                  if (!commentsFlag) {
                    router.push(`/detail/${row.storyId}`);
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
                    alignItems: "center",
                    gap: 1,
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default CustomizedUserTables;
