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
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { TableStoryType } from "../../types/tableType";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import NotificationsIcon from "@mui/icons-material/Notifications";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useTheme } from "@mui/material/styles";
import BlindWrapper from "../BlindWrapper";
import { useAdmin } from "../../hooks/useAdmin";

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
  channelId?: number; // 채널 ID 추가 (채널 관리자 권한 체크용)
  onDataChange?: () => void; // 데이터 변경 시 콜백
}

const CustomizedTables = ({
  tableData,
  onRowClick,
  channelId,
  onDataChange,
}: CustomizedTablesProps): React.ReactNode => {
  const router = useRouter();
  const theme = useTheme();
  const admin = useAdmin();

  // 삭제 확인 다이얼로그 상태
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    storyId: number | null;
    title: string;
  }>({
    open: false,
    storyId: null,
    title: "",
  });

  // 관리자 삭제 핸들러
  const handleAdminDelete = (storyId: number, title: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 행 클릭 이벤트 방지
    setDeleteDialog({
      open: true,
      storyId,
      title,
    });
  };

  // 삭제 확인 처리
  const handleConfirmDelete = async () => {
    if (!deleteDialog.storyId) return;

    await admin.deleteStory(
      deleteDialog.storyId,
      channelId,
      () => {
        setDeleteDialog({ open: false, storyId: null, title: "" });
        onDataChange?.(); // 데이터 새로고침
        alert("게시글이 삭제되었습니다.");
      },
      (error) => {
        alert(`삭제 실패: ${error.message}`);
      }
    );
  };

  // 삭제 취소 처리
  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, storyId: null, title: "" });
  };

  // 관리자 권한이 있는지 체크
  const hasAdminPermission = admin.hasAdminPermission(channelId);

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
        }}
      >
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
              {hasAdminPermission && (
                <StyledTableCell sx={{ width: "80px", textAlign: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 0.5 }} />
                    관리
                  </Box>
                </StyledTableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={hasAdminPermission ? 7 : 6} align="center" sx={{ height: "120px" }}>
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
                  {hasAdminPermission && (
                    <StyledTableCell sx={{ textAlign: "center" }}>
                      <Tooltip title={`관리자 삭제 (${admin.getAdminBadgeText(channelId)})`}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(event) => handleAdminDelete(row.id, row.title, event)}
                          disabled={admin.isLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </StyledTableCell>
                  )}
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 관리자 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialog.open} onClose={handleCancelDelete} aria-labelledby="admin-delete-dialog-title">
        <DialogTitle
          id="admin-delete-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "error.main",
          }}
        >
          <AdminPanelSettingsIcon />
          관리자 권한으로 게시글 삭제
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            다음 게시글을 삭제하시겠습니까?
          </Typography>
          <Typography
            variant="body2"
            sx={{
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 1,
              maxWidth: "400px",
              wordBreak: "break-word",
            }}
          >
            "{deleteDialog.title}"
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            ⚠️ 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={admin.isLoading}>
            {admin.isLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomizedTables;
