import React from "react";
import { Box, Button, CircularProgress, Tooltip, useTheme } from "@mui/material";
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Report as ReportIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";

/**
 * StoryActions 컴포넌트의 Props 인터페이스
 * 초보자도 이해하기 쉽도록 각 prop의 역할을 명시
 */
interface StoryActionsProps {
  /** 현재 로그인된 사용자의 ID */
  currentUserId?: string;
  /** 게시글 작성자의 ID */
  authorId?: string;
  /** 게시글 카테고리 */
  category?: string;
  /** 게시글 ID */
  storyId: number;

  // 스크랩 관련
  /** 스크랩 상태 */
  isScraped: boolean;
  /** 스크랩 로딩 상태 */
  scrapLoading: boolean;
  /** 스크랩 버튼 클릭 핸들러 */
  onScrapClick: () => void;

  // 신고 관련
  /** 신고 버튼 클릭 핸들러 */
  onReportClick: () => void;

  // 수정/삭제 관련
  /** 수정 버튼 상태 */
  editFlag: boolean;
  /** 수정 버튼 클릭 핸들러 */
  onEditClick: () => void;
  /** 삭제 버튼 클릭 핸들러 */
  onDeleteClick: () => void;

  // 관리자 관련
  /** 관리자 권한 여부 */
  hasAdminPermission: boolean;
  /** 관리자 로딩 상태 */
  adminLoading: boolean;
  /** 관리자 권한 텍스트 */
  adminBadgeText: string;
  /** 관리자 삭제 버튼 클릭 핸들러 */
  onAdminDeleteClick: () => void;
}

/**
 * 게시글 상세 페이지의 액션 버튼들을 담당하는 컴포넌트
 * 스크랩, 신고, 수정, 삭제, 관리자 삭제 기능을 제공
 */
const StoryActions: React.FC<StoryActionsProps> = ({
  currentUserId,
  authorId,
  category,
  storyId,
  isScraped,
  scrapLoading,
  onScrapClick,
  onReportClick,
  editFlag,
  onEditClick,
  onDeleteClick,
  hasAdminPermission,
  adminLoading,
  adminBadgeText,
  onAdminDeleteClick,
}) => {
  const theme = useTheme();

  /** 자신의 글인지 확인 */
  const isOwnStory = currentUserId && authorId === currentUserId;

  /** 로그인한 사용자이고 자신의 글이 아닌지 확인 */
  const canInteract = currentUserId && !isOwnStory;

  return (
    <Box display="flex" gap={1.5}>
      {/* 신고 버튼 - 로그인한 사용자이고 자신의 글이 아닐 때만 표시 */}
      {canInteract && (
        <Tooltip title="신고하기">
          <Button
            size="medium"
            variant="outlined"
            onClick={onReportClick}
            startIcon={<ReportIcon sx={{ fontSize: 22 }} />}
            sx={{
              borderRadius: "14px",
              fontWeight: 700,
              px: 3,
              py: 1.5,
              position: "relative",
              overflow: "hidden",
              textTransform: "none",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
              border:
                theme.palette.mode === "dark" ? "2px solid rgba(239, 68, 68, 0.4)" : "2px solid rgba(239, 68, 68, 0.3)",
              color: theme.palette.mode === "dark" ? "#fca5a5" : "#dc2626",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 10px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 0 10px rgba(239, 68, 68, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                background: "linear-gradient(45deg, #ef4444, #dc2626, #b91c1c, #ef4444)",
                borderRadius: "16px",
                opacity: 0.15,
                animation: "borderGlow 6s linear infinite",
                zIndex: -1,
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: "50%",
                left: "-100%",
                width: "200%",
                height: "1px",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)",
                transform: "translateY(-50%)",
                animation: "scanLine 5s ease-in-out infinite",
                zIndex: 1,
                pointerEvents: "none",
              },
              "@keyframes borderGlow": {
                "0%": {
                  backgroundPosition: "0% 50%",
                  filter: "hue-rotate(0deg)",
                },
                "50%": {
                  backgroundPosition: "100% 50%",
                  filter: "hue-rotate(60deg)",
                },
                "100%": {
                  backgroundPosition: "0% 50%",
                  filter: "hue-rotate(0deg)",
                },
              },
              "@keyframes scanLine": {
                "0%": { left: "-100%", opacity: 0 },
                "50%": { left: "50%", opacity: 1 },
                "100%": { left: "200%", opacity: 0 },
              },
              "&:hover": {
                transform: "translateY(-1px) scale(1.01)",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))"
                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(220, 38, 38, 0.01))",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 15px rgba(239, 68, 68, 0.25)"
                    : "0 0 15px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)",
              },
              "&:active": {
                transform: "translateY(-1px) scale(0.98)",
              },
              "& .MuiButton-startIcon": {
                filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
              },
            }}
          >
            신고하기
          </Button>
        </Tooltip>
      )}

      {/* 스크랩 버튼 - 로그인한 사용자이고 자신의 글이 아닐 때만 표시 */}
      {canInteract && (
        <Tooltip title={isScraped ? "스크랩 취소" : "스크랩"}>
          <Button
            size="medium"
            variant={isScraped ? "contained" : "outlined"}
            onClick={onScrapClick}
            disabled={scrapLoading}
            startIcon={
              scrapLoading ? (
                <CircularProgress size={20} />
              ) : isScraped ? (
                <BookmarkIcon sx={{ fontSize: 22 }} />
              ) : (
                <BookmarkBorderIcon sx={{ fontSize: 22 }} />
              )
            }
            sx={{
              borderRadius: "14px",
              fontWeight: 700,
              px: 3,
              py: 1.5,
              position: "relative",
              overflow: "hidden",
              textTransform: "none",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              background: isScraped
                ? theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2))"
                  : "linear-gradient(135deg, #22c55e, #16a34a, #15803d)"
                : theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95))",
              border: isScraped
                ? theme.palette.mode === "dark"
                  ? "2px solid rgba(34, 197, 94, 0.6)"
                  : "2px solid rgba(34, 197, 94, 0.4)"
                : theme.palette.mode === "dark"
                  ? "2px solid rgba(34, 197, 94, 0.4)"
                  : "2px solid rgba(34, 197, 94, 0.3)",
              color: isScraped ? "white" : theme.palette.mode === "dark" ? "#86efac" : "#16a34a",
              boxShadow: isScraped
                ? theme.palette.mode === "dark"
                  ? "0 0 12px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 0 12px rgba(34, 197, 94, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
                : theme.palette.mode === "dark"
                  ? "0 0 10px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 0 10px rgba(34, 197, 94, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                background: "linear-gradient(45deg, #22c55e, #16a34a, #15803d, #22c55e)",
                borderRadius: "16px",
                opacity: 0.2,
                animation: "borderGlow 6s linear infinite",
                zIndex: -1,
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: "50%",
                left: "-100%",
                width: "200%",
                height: "1px",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.4), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)",
                transform: "translateY(-50%)",
                animation: "scanLine 5s ease-in-out infinite",
                animationDelay: "1s",
                zIndex: 1,
                pointerEvents: "none",
              },
              "@keyframes borderGlow": {
                "0%": {
                  backgroundPosition: "0% 50%",
                  filter: "hue-rotate(0deg)",
                },
                "50%": {
                  backgroundPosition: "100% 50%",
                  filter: "hue-rotate(120deg)",
                },
                "100%": {
                  backgroundPosition: "0% 50%",
                  filter: "hue-rotate(0deg)",
                },
              },
              "@keyframes scanLine": {
                "0%": { left: "-100%", opacity: 0 },
                "50%": { left: "50%", opacity: 1 },
                "100%": { left: "200%", opacity: 0 },
              },
              "&:hover": {
                transform: "translateY(-1px) scale(1.01)",
                background: isScraped
                  ? theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))"
                    : "linear-gradient(135deg, #16a34a, #15803d, #166534)"
                  : theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.08))"
                    : "linear-gradient(135deg, rgba(34, 197, 94, 0.03), rgba(22, 163, 74, 0.01))",
                boxShadow: isScraped
                  ? theme.palette.mode === "dark"
                    ? "0 0 18px rgba(34, 197, 94, 0.3)"
                    : "0 0 18px rgba(34, 197, 94, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)"
                  : theme.palette.mode === "dark"
                    ? "0 0 15px rgba(34, 197, 94, 0.25)"
                    : "0 0 15px rgba(34, 197, 94, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)",
              },
              "&:active": {
                transform: "translateY(-1px) scale(0.98)",
              },
              "&:disabled": {
                background: isScraped
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2))"
                  : "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))",
                transform: "none",
                boxShadow: "none",
              },
              "& .MuiButton-startIcon": {
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
              },
            }}
          >
            {isScraped ? "스크랩 취소" : "스크랩"}
          </Button>
        </Tooltip>
      )}

      {/* 수정/삭제 버튼 - 자신의 글일 때만 표시 (question 카테고리 제외) */}
      {isOwnStory && category !== "question" && (
        <>
          <Button
            size="medium"
            variant="outlined"
            color="warning"
            onClick={onEditClick}
            disabled={editFlag}
            startIcon={editFlag ? <CircularProgress size={20} /> : null}
          >
            수정
          </Button>
          <Button size="medium" variant="outlined" color="error" onClick={onDeleteClick}>
            삭제
          </Button>
        </>
      )}

      {/* 관리자 삭제 버튼 - 관리자 권한이 있을 때 표시 (카테고리 무관) */}
      {hasAdminPermission && (
        <Button
          size="medium"
          variant="contained"
          color="error"
          onClick={onAdminDeleteClick}
          disabled={adminLoading}
          startIcon={adminLoading ? <CircularProgress size={20} /> : <FlagIcon />}
          sx={{
            background: "linear-gradient(45deg, #f44336, #d32f2f)",
            "&:hover": {
              background: "linear-gradient(45deg, #d32f2f, #b71c1c)",
            },
          }}
        >
          {adminLoading ? "삭제 중..." : `관리자 삭제 (${adminBadgeText})`}
        </Button>
      )}
    </Box>
  );
};

export default StoryActions;
