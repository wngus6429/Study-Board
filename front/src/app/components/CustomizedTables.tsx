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
import { Story } from "../types/story";
import { Button } from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
//! 몇분전 글이 쓰여졌다 등등 활용, 옛날에는 모먼트를 많이썻다함
import relativeTime from "dayjs/plugin/relativeTime";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "../store";

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
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

interface CustomizedTablesProps {
  tableData: any;
}

const CustomizedTables = ({ tableData }: CustomizedTablesProps): React.ReactNode => {
  const queryClient = useQueryClient();
  const { showMessage } = useMessage((state) => state);

  const deleteData = useMutation({
    mutationFn: async (storyId: number) => {
      return await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/story/${storyId}`, { withCredentials: true });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      showMessage("삭제 성공", "success");
    },
  });

  return (
    <TableContainer component={Paper}>
      <Table sx={{ width: "100%" }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>번호</StyledTableCell>
            <StyledTableCell sx={{ width: "400px" }}>제목</StyledTableCell>
            <StyledTableCell sx={{ width: "150px" }}>작성자</StyledTableCell>
            <StyledTableCell sx={{ width: "180px" }}>등록일</StyledTableCell>
            <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>조회수</StyledTableCell>
            <StyledTableCell sx={{ width: "75px", textAlign: "center" }}>추천</StyledTableCell>
            <StyledTableCell sx={{ width: "160px", textAlign: "center" }}>기타</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row: Story) => (
            <StyledTableRow key={row.id}>
              <StyledTableCell component="th" scope="row" sx={{ textAlign: "center" }}>
                {row.id}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  display: "flex", // Flexbox 사용
                  alignItems: "center", // 수직 가운데 정렬
                }}
              >
                {row.title}
              </StyledTableCell>
              <StyledTableCell>
                {row.creator.length > 6 ? `${row.creator.slice(0, 6)}...` : row.creator}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  display: "flex", // Flexbox 사용
                  alignItems: "center", // 수직 가운데 정렬
                }}
              >
                {dayjs(row.createdAt).format("YYYY.MM.DD HH:mm")}
              </StyledTableCell>
              <StyledTableCell>{row.readCount}</StyledTableCell>
              <StyledTableCell sx={{ textAlign: "center" }}>{row.likeCount}</StyledTableCell>
              {/* TODO 추천하기 버튼, 로그인 해서 내꺼면 삭제 혹은 수정 버튼 */}
              <StyledTableCell
                sx={{
                  display: "flex", // Flexbox 사용
                  alignItems: "center", // 수직 가운데 정렬
                  justifyContent: "space-between", // 좌우 정렬
                }}
              >
                <Button
                  sx={{ float: "right", padding: "0px" }}
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteData.mutate(row.id);
                  }}
                  color="warning"
                >
                  수정하기
                </Button>
                <Button
                  sx={{ float: "right", padding: "0px" }}
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteData.mutate(row.id);
                  }}
                  color="error"
                >
                  삭제
                </Button>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomizedTables;
