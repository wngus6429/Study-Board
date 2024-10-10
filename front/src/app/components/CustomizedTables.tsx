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

function createData(name: string, calories: number, fat: number, carbs: number, protein: number) {
  return { name, calories, fat, carbs, protein };
}

interface CustomizedTablesProps {
  tableData: any;
}

export default function CustomizedTables({ tableData }: CustomizedTablesProps) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ width: "100%" }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>게시글 번호</StyledTableCell>
            <StyledTableCell sx={{ width: "500px" }}>제목</StyledTableCell>
            <StyledTableCell sx={{ width: "80px" }}>작성자</StyledTableCell>
            <StyledTableCell sx={{ width: "220px" }}>등록일</StyledTableCell>
            <StyledTableCell>조회수</StyledTableCell>
            <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>추천</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row: Story) => (
            <StyledTableRow key={row.id}>
              <StyledTableCell component="th" scope="row" sx={{ textAlign: "center" }}>
                {row.id}
              </StyledTableCell>
              <StyledTableCell>{row.title}</StyledTableCell>
              <StyledTableCell>{row.creator}</StyledTableCell>
              <StyledTableCell>{row.createdAt.toLocaleString()}</StyledTableCell>
              <StyledTableCell>{row.readCount}</StyledTableCell>
              <StyledTableCell sx={{ textAlign: "center" }}>{row.likeCount}</StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
