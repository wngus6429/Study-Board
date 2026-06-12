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
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "@mui/material/styles";
import BlindWrapper from "../BlindWrapper";

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

const NoticeRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "#fff8e1",
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "#ffecb3",
    transition: "background-color 0.3s ease",
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  height: "60px", // 모든 행의 높이를 일정하게 설정
}));

interface CustomizedTablesProps {
  tableData: any;
  onRowClick?: (postId: number) => void;
}

const CustomizedTables = ({ tableData, onRowClick }: CustomizedTablesProps): React.ReactNode => {
  const router = useRouter();
  const theme = useTheme();

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
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : 3,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "background.paper",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "none",
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        <Table aria-label="customized table" sx={{ minWidth: { xs: 760, md: "100%" } }}>
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
                    <Typography variant="body2" color="text.secondary">
                      첫 번째 게시글을 작성해보세요!
                    </Typography>
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              tableData.map((row: TableStoryType) => (
                <StyledTableRow
                  key={row.id}
                  onClick={() => {
                    // 현재 페이지 URL을 세션 스토리지에 저장
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("previousMainPageUrl", window.location.href);
                    }
                    if (onRowClick) {
                      onRowClick(row.id);
                    } else {
                      // 기본 동작 (메인 페이지에서 사용될 때)
                      router.push(`/detail/${row.id}`);
                    }
                  }}
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
                              fontSize: "1.1rem",
                              ml: 1,
                              verticalAlign: "middle",
                              color: "#10b981", // 에메랄드 그린
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              borderRadius: "4px",
                              padding: "2px",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 4px 8px rgba(16, 185, 129, 0.4)",
                              },
                            }}
                          />
                        )}
                        {row.videoFlag && (
                          <VideoLibraryIcon
                            sx={{
                              fontSize: "1.1rem",
                              ml: 1,
                              verticalAlign: "middle",
                              color: "#ef4444", // 빨간색
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              borderRadius: "4px",
                              padding: "2px",
                              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 4px 8px rgba(239, 68, 68, 0.4)",
                              },
                            }}
                          />
                        )}
                      </Typography>
                      {row.userId ? (
                        <BlindWrapper userId={row.userId} type="post">
                          {row.title} {row.comment_count > 0 && `(${row.comment_count})`}
                        </BlindWrapper>
                      ) : (
                        <>
                          {row.title} {row.comment_count > 0 && `(${row.comment_count})`}
                        </>
                      )}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    {row.nickname.length > 15 ? `${row.nickname.slice(0, 15)}...` : row.nickname}
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
