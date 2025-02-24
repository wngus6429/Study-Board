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
import { TableStoryType } from "../types/tableType";
import ImageIcon from "@mui/icons-material/Image";

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

// const StyledTableCell = styled(TableCell)(({ theme }) => ({
//   [`&.${tableCellClasses.head}`]: {
//     backgroundColor: theme.palette.common.black,
//     color: theme.palette.common.white,
//     // 헤더 셀 높이 고정
//     height: 40,
//     lineHeight: "40px",
//     // 혹은 padding을 더 줄이기
//     padding: "0 8px",
//   },
//   [`&.${tableCellClasses.body}`]: {
//     fontSize: 14,
//     // 바디 셀 높이 고정
//     height: 40,
//     lineHeight: "40px",
//     padding: "0 8px",
//     // 텍스트가 길 경우 한 줄로 처리(필요 시)
//     whiteSpace: "nowrap",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//   },
// }));

interface CustomizedTablesProps {
  tableData: any;
}

const CustomizedTables = ({ tableData }: CustomizedTablesProps): React.ReactNode => {
  const router = useRouter();

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "110px", textAlign: "center" }}>번호</StyledTableCell>
              <StyledTableCell sx={{ width: "500px" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "160px" }}>작성자</StyledTableCell>
              <StyledTableCell sx={{ width: "180px" }}>등록일</StyledTableCell>
              <StyledTableCell sx={{ width: "100px", textAlign: "center" }}>조회수</StyledTableCell>
              <StyledTableCell sx={{ width: "75px", textAlign: "center" }}>추천</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row: TableStoryType) => (
              <StyledTableRow
                key={row.id}
                onClick={() => {
                  router.push(`/detail/${row.id}`);
                }}
                sx={{ cursor: "pointer" }}
              >
                <StyledTableCell component="th" scope="row" sx={{ textAlign: "center" }}>
                  {row.id}
                </StyledTableCell>
                <StyledTableCell>
                  {row.category === "question" && (
                    <Box
                      sx={{
                        display: "inline-block",
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        px: 1,
                        py: 0.4,
                        borderRadius: 1,
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginRight: 1,
                        lineHeight: 1, // 줄 간격 축소
                      }}
                    >
                      질문
                    </Box>
                  )}
                  <Typography variant="body1" color="text.primary" component="span">
                    {row.imageFlag && <ImageIcon sx={{ fontSize: "1rem", ml: 1, verticalAlign: "middle" }} />}{" "}
                    {row.title}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell>
                  {row.nickname.length > 6 ? `${row.nickname.slice(0, 15)}...` : row.nickname}
                </StyledTableCell>
                <StyledTableCell
                  sx={{
                    alignItems: "center", // 수직 가운데 정렬
                  }}
                >
                  {dayjs(row.created_at).format("YYYY.MM.DD HH:mm")}
                </StyledTableCell>
                <StyledTableCell sx={{ textAlign: "center" }}>{row.read_count}</StyledTableCell>
                <StyledTableCell sx={{ textAlign: "center" }}>{row.recommend_Count}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default CustomizedTables;
