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
import { TableStoryType } from "../../types/tableType";
import ImageIcon from "@mui/icons-material/Image";
import NotificationsIcon from "@mui/icons-material/Notifications";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";

// 추가 아이콘 import
import ForumIcon from "@mui/icons-material/Forum";
import InfoIcon from "@mui/icons-material/Info";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

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

  // 카테고리별 Chip을 렌더링하는 헬퍼 함수
  const getCategoryChip = (category: string) => {
    switch (category) {
      case "question":
        return <Chip icon={<QuestionAnswerIcon />} label="질문" color="secondary" size="small" sx={{ mr: 1 }} />;
      case "chat":
        return <Chip icon={<ForumIcon />} label="잡담" color="default" size="small" sx={{ mr: 1 }} />;
      case "info":
        return <Chip icon={<InfoIcon />} label="정보" color="primary" size="small" sx={{ mr: 1 }} />;
      case "review":
        return <Chip icon={<RateReviewIcon />} label="리뷰" color="primary" size="small" sx={{ mr: 1 }} />;
      case "screenshot":
        return <Chip icon={<CameraAltIcon />} label="스샷" color="primary" size="small" sx={{ mr: 1 }} />;
      case "etc":
        return <Chip icon={<MoreHorizIcon />} label="기타" color="default" size="small" sx={{ mr: 1 }} />;
      default:
        return null;
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ width: "100px", textAlign: "center" }}>번호</StyledTableCell>
              <StyledTableCell sx={{ width: "460px" }}>제목</StyledTableCell>
              <StyledTableCell sx={{ width: "160px" }}>작성자</StyledTableCell>
              <StyledTableCell sx={{ width: "150px", textAlign: "center" }}>등록일</StyledTableCell>
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
            {tableData.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={6} align="center" sx={{ height: "120px" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6">😊 게시글이 없습니다</Typography>
                    <Typography variant="body2" color="text.secondary">첫 번째 게시글을 작성해보세요!</Typography>
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              tableData.map((row: TableStoryType) => (
                <StyledTableRow
                  key={row.id}
                  onClick={() => router.push(`/detail/story/${row.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <StyledTableCell component="th" scope="row" sx={{ textAlign: "center" }}>
                    {row.id}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                      {/* 카테고리에 따른 Chip을 렌더링 */}
                      {getCategoryChip(row.category) || <Box sx={{ width: "56px", height: "24px" }}></Box>}
                      {/* 추천 랭킹 게시글 표시 */}
                      {row.isRecommendRanking && (
                        <EmojiEventsIcon
                          sx={{
                            fontSize: "1.2rem",
                            color: "#ff9800",
                            mr: 1,
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      <Typography variant="body1" color="text.primary" component="span" sx={{ mr: 1 }}>
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
                      {row.title} {row.comment_count > 0 && `(${row.comment_count})`}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    {row.nickname.length > 6 ? `${row.nickname.slice(0, 15)}...` : row.nickname}
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>
                    {dayjs(row.created_at).isSame(dayjs(), "day")
                      ? dayjs(row.created_at).format("HH:mm")
                      : dayjs(row.created_at).format("YYYY/MM/DD")}
                  </StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>{row.read_count}</StyledTableCell>
                  <StyledTableCell sx={{ textAlign: "center" }}>{row.recommend_Count}</StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default CustomizedTables;
