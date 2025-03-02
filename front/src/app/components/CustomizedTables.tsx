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
import { Box, Typography, Chip } from "@mui/material";
import { TableStoryType } from "../types/tableType";
import ImageIcon from "@mui/icons-material/Image";
import NotificationsIcon from "@mui/icons-material/Notifications";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";

dayjs.extend(relativeTime);

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

const NoticeRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: "#fff8e1",
  "&:hover": {
    backgroundColor: "#ffecb3",
    transition: "background-color 0.3s ease",
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  height: "60px", // 모든 행의 높이를 일정하게 설정
}));

interface CustomizedTablesProps {
  tableData: any;
}

const CustomizedTables = ({ tableData }: CustomizedTablesProps): React.ReactNode => {
  const router = useRouter();

  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "110px", textAlign: "center" }}>번호</StyledTableCell>
              <StyledTableCell sx={{ width: "450px" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "160px" }}>작성자</StyledTableCell>
              <StyledTableCell sx={{ width: "180px" }}>등록일</StyledTableCell>
              <StyledTableCell sx={{ width: "125px", textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                  조회수
                </Box>
              </StyledTableCell>
              <StyledTableCell sx={{ width: "100px", textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ThumbUpAltIcon fontSize="small" sx={{ mr: 0.5 }} />
                  추천
                </Box>
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row: TableStoryType) =>
              row.isNotice ? (
                <NoticeRow key={row.id} onClick={() => router.push(`/notice/${row.id}`)} sx={{ cursor: "pointer" }}>
                  <StyledTableCell component="th" scope="row" sx={{ textAlign: "center" }}>
                    <Chip
                      icon={<NotificationsIcon />}
                      label="공지"
                      color="primary"
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body1" color="text.primary" component="span" sx={{ fontWeight: "bold" }}>
                      {row.title}
                      {row.imageFlag && (
                        <ImageIcon sx={{ fontSize: "1rem", ml: 1, verticalAlign: "middle", color: "info.main" }} />
                      )}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    {row.nickname.length > 6 ? `${row.nickname.slice(0, 15)}...` : row.nickname}
                  </StyledTableCell>
                  <StyledTableCell>{dayjs(row.created_at).format("YYYY.MM.DD HH:mm")}</StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>{row.read_count}</StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>공지</StyledTableCell>
                </NoticeRow>
              ) : (
                <StyledTableRow
                  key={row.id}
                  onClick={() => router.push(`/detail/${row.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <StyledTableCell component="th" scope="row" sx={{ textAlign: "center" }}>
                    {row.id}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                      {row.category === "question" ? (
                        <Chip
                          icon={<QuestionAnswerIcon />}
                          label="질문"
                          color="secondary"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      ) : (
                        <Box sx={{ width: "56px", height: "24px", mr: 1 }}></Box>
                      )}
                      <Typography variant="body1" color="text.primary" component="span">
                        {row.title}
                        {row.imageFlag && (
                          <ImageIcon
                            sx={{
                              fontSize: "1rem",
                              ml: 1,
                              verticalAlign: "middle",
                              color: "info.main",
                            }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    {row.nickname.length > 6 ? `${row.nickname.slice(0, 15)}...` : row.nickname}
                  </StyledTableCell>
                  <StyledTableCell>{dayjs(row.created_at).format("YYYY.MM.DD HH:mm")}</StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>{row.read_count}</StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>{row.recommend_Count}</StyledTableCell>
                </StyledTableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default CustomizedTables;
