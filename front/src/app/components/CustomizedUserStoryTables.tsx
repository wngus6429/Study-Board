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
import { StoryType } from "../types/imageTypes";
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
              <StyledTableCell sx={{ width: "200px" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "170px", textAlign: "right" }}>등록일</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row: StoryType) => (
              <StyledTableRow
                key={row.id}
                onClick={() => {
                  router.push(`/detail/${row.id}`);
                }}
                sx={{ cursor: "pointer" }}
              >
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
                  <Typography variant="body1" color="text.primary" noWrap>
                    {row.title}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell sx={{ textAlign: "right", fontSize: "0.875rem", color: "text.secondary" }}>
                  {dayjs(row.created_at).format("YYYY.MM.DD HH:mm")}
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
