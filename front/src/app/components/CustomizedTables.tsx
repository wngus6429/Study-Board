// 테이블 컴포넌트
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
import { Button } from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
//! 몇분전 글이 쓰여졌다 등등 활용, 옛날에는 모먼트를 많이썻다함
import relativeTime from "dayjs/plugin/relativeTime";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "../store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";

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
}

const CustomizedTables = ({ tableData }: CustomizedTablesProps): React.ReactNode => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showMessage } = useMessage((state) => state);

  const [data, setData] = useState<StoryType[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const rowsPerPage = 20;

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const offset = currentPage * rowsPerPage;
  //       const response = await axios.get(
  //         `${process.env.NEXT_PUBLIC_BASE_URL}/api/stories?offset=${offset}&limit=${rowsPerPage}`
  //       );
  //       setData(response.data.rows);
  //     } catch (error) {
  //       console.error("데이터를 가져오는 중 오류가 발생했습니다:", error);
  //     }
  //   };

  //   fetchData();
  // }, [currentPage]);

  const handlePageClick = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
  };
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
            {tableData.map((row: StoryType) => (
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
                <StyledTableCell
                  sx={{
                    alignItems: "center", // 수직 가운데 정렬
                  }}
                >
                  {row.title}
                </StyledTableCell>
                <StyledTableCell>
                  {row.User.nickname.length > 6 ? `${row.User.nickname.slice(0, 6)}...` : row.User.nickname}
                </StyledTableCell>
                <StyledTableCell
                  sx={{
                    alignItems: "center", // 수직 가운데 정렬
                  }}
                >
                  {dayjs(row.created_at).format("YYYY.MM.DD HH:mm")}
                </StyledTableCell>
                <StyledTableCell sx={{ textAlign: "center" }}>{row.read_count}</StyledTableCell>
                <StyledTableCell sx={{ textAlign: "center" }}>{row.like_count}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
        {/* <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      /> */}
      </TableContainer>
      <ReactPaginate
        previousLabel={"이전"}
        nextLabel={"다음"}
        breakLabel={"..."}
        breakClassName={"break-me"}
        pageCount={pageCount} // 실제 데이터 총 페이지 수 사용
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageClick}
        containerClassName={"pagination"}
        activeClassName={"active"}
        disabledClassName={"disabled"} // 비활성화된 버튼 스타일
      />
    </>
  );
};

export default CustomizedTables;
