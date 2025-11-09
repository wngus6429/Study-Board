"use client";

import React from "react";
import { Box, Tab, Tabs, IconButton, Button, useTheme } from "@mui/material";
import { Create as CreateIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon } from "@mui/icons-material";
import { TAB_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";

interface ChannelTabNavigationProps {
  // 현재 상태
  currentTab: string;
  viewMode: "table" | "card";
  showChat: boolean;

  // 세션 정보
  hasSession: boolean;
  isMobileViewOnly?: boolean;

  // 핸들러들
  onTabChange: (event: React.SyntheticEvent, newValue: string) => void;
  onViewModeChange: (mode: "table" | "card") => void;
  onWritePost: () => void;
}

const ChannelTabNavigation: React.FC<ChannelTabNavigationProps> = ({
  currentTab,
  viewMode,
  showChat,
  hasSession,
  isMobileViewOnly,
  onTabChange,
  onViewModeChange,
  onWritePost,
}) => {
  const theme = useTheme();

  if (showChat) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        borderRadius: "16px",
        position: "relative",
        overflow: "hidden",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(45, 48, 71, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
        border:
          theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.3)" : "2px solid rgba(139, 92, 246, 0.2)",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 0 30px rgba(139, 92, 246, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)"
              : "linear-gradient(45deg, #8b5cf6, #06b6d4, #8b5cf6, #06b6d4)",
          opacity: 0.1,
          animation: "borderGlow 4s linear infinite",
          zIndex: 0,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          left: "-100%",
          width: "200%",
          height: "2px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)"
              : "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)",
          transform: "translateY(-50%)",
          animation: "scanLine 3s ease-in-out infinite",
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
            filter: "hue-rotate(180deg)",
          },
          "100%": {
            backgroundPosition: "0% 50%",
            filter: "hue-rotate(360deg)",
          },
        },
        "@keyframes scanLine": {
          "0%": { left: "-100%", opacity: 0 },
          "50%": { left: "50%", opacity: 1 },
          "100%": { left: "200%", opacity: 0 },
        },
      }}
    >
      <Tabs
        value={currentTab}
        onChange={onTabChange}
        textColor="secondary"
        indicatorColor="secondary"
        aria-label="channel tabs"
        variant="scrollable"
        scrollButtons={"auto"}
        sx={{
          flexGrow: 1,
          position: "relative",
          zIndex: 2,
          "& .MuiTab-root": {
            minWidth: "90px",
            maxWidth: "120px",
            width: "auto",
            fontWeight: 700,
            fontSize: "1rem", // 폰트 크기 약간 줄임
            py: 1,
            px: 2, // 좌우 패딩 조정
            position: "relative",
            overflow: "hidden",
            borderRadius: "12px",
            margin: "6px 2px", // 좌우 마진 줄임
            transition: "all 0.3s ease",
            color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
            textShadow: theme.palette.mode === "dark" ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "none",
            // 텍스트가 길어질 경우 처리
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))"
                  : "linear-gradient(135deg, rgba(139, 92, 246, 0.03), rgba(6, 182, 212, 0.03))",
              borderRadius: "12px",
              opacity: 0,
              transition: "opacity 0.3s ease",
              zIndex: -1,
            },
            "&:hover": {
              transform: "translateY(-2px) scale(1.02)",
              color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 8px 25px rgba(139, 92, 246, 0.3), 0 0 15px rgba(139, 92, 246, 0.2)"
                  : "0 8px 25px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.1)",
              "&::before": {
                opacity: 1,
              },
            },
            "&.Mui-selected": {
              color: theme.palette.mode === "dark" ? "#ffffff" : "#8b5cf6",
              // fontWeight를 동일하게 유지하여 너비 변화 방지
              fontWeight: 700,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                  : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              border:
                theme.palette.mode === "dark"
                  ? "1px solid rgba(139, 92, 246, 0.4)"
                  : "1px solid rgba(139, 92, 246, 0.3)",
              transform: "translateY(-1px)",
            },
            // 아이콘과 텍스트 간격 조정
            "& .MuiTab-iconWrapper": {
              marginBottom: "2px",
              "& svg": {
                fontSize: "20px", // 아이콘 크기 조정
              },
            },
          },
          "& .MuiTabs-indicator": {
            display: "none",
          },
          // 스크롤 버튼 스타일링
          "& .MuiTabs-scrollButtons": {
            "&.Mui-disabled": {
              opacity: 0.3,
            },
          },
        }}
      >
        {TAB_SELECT_OPTIONS.filter((option) => {
          // "건의" 탭은 로그인 상태일 때만 표시
          if (option.value === "suggestion" && !hasSession) return false;
          return true;
        }).map((option) => (
          <Tab
            key={option.value}
            icon={option.icon}
            label={option.name}
            value={option.value}
            // 접근성을 위한 aria-label 추가
            aria-label={`${option.name} 탭`}
          />
        ))}
      </Tabs>

      {/* 뷰 모드 토글 버튼 - 건의사항 탭이 아닐 때만 표시 */}
      {currentTab !== "suggestion" && !isMobileViewOnly && (
        <Box
          sx={{
            display: "flex",
            gap: 0.5, // 버튼 간격 줄임
            mr: 1,
            position: "relative",
            zIndex: 2,
          }}
        >
          <IconButton
            onClick={() => onViewModeChange("table")}
            sx={{
              borderRadius: "12px",
              p: 1.2, // 패딩 약간 줄임
              width: "44px", // 고정 너비
              height: "44px", // 고정 높이
              position: "relative",
              overflow: "hidden",
              background:
                viewMode === "table"
                  ? theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))"
                  : "transparent",
              border:
                viewMode === "table"
                  ? theme.palette.mode === "dark"
                    ? "2px solid rgba(139, 92, 246, 0.5)"
                    : "2px solid rgba(139, 92, 246, 0.3)"
                  : theme.palette.mode === "dark"
                    ? "2px solid rgba(255, 255, 255, 0.1)"
                    : "2px solid rgba(0, 0, 0, 0.1)",
              color:
                viewMode === "table"
                  ? theme.palette.mode === "dark"
                    ? "#a78bfa"
                    : "#8b5cf6"
                  : theme.palette.mode === "dark"
                    ? "#94a3b8"
                    : "#64748b",
              transition: "all 0.3s ease",
              boxShadow:
                viewMode === "table"
                  ? theme.palette.mode === "dark"
                    ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                  : "none",
              "&:hover": {
                transform: "translateY(-2px) scale(1.05)",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 25px rgba(139, 92, 246, 0.3)"
                    : "0 8px 25px rgba(139, 92, 246, 0.2)",
                color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
              },
            }}
            aria-label="테이블 뷰"
          >
            <ViewListIcon sx={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />
          </IconButton>

          <IconButton
            onClick={() => onViewModeChange("card")}
            sx={{
              borderRadius: "12px",
              p: 1.2, // 패딩 약간 줄임
              width: "44px", // 고정 너비
              height: "44px", // 고정 높이
              position: "relative",
              overflow: "hidden",
              background:
                viewMode === "card"
                  ? theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))"
                  : "transparent",
              border:
                viewMode === "card"
                  ? theme.palette.mode === "dark"
                    ? "2px solid rgba(139, 92, 246, 0.5)"
                    : "2px solid rgba(139, 92, 246, 0.3)"
                  : theme.palette.mode === "dark"
                    ? "2px solid rgba(255, 255, 255, 0.1)"
                    : "2px solid rgba(0, 0, 0, 0.1)",
              color:
                viewMode === "card"
                  ? theme.palette.mode === "dark"
                    ? "#a78bfa"
                    : "#8b5cf6"
                  : theme.palette.mode === "dark"
                    ? "#94a3b8"
                    : "#64748b",
              transition: "all 0.3s ease",
              boxShadow:
                viewMode === "card"
                  ? theme.palette.mode === "dark"
                    ? "0 0 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    : "0 0 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
                  : "none",
              "&:hover": {
                transform: "translateY(-2px) scale(1.05)",
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.05))",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 25px rgba(139, 92, 246, 0.3)"
                    : "0 8px 25px rgba(139, 92, 246, 0.2)",
                color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
              },
            }}
            aria-label="카드 뷰"
          >
            <ViewModuleIcon sx={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }} />
          </IconButton>
        </Box>
      )}

      {/* 글쓰기 버튼 */}
      {hasSession && (
        <Button
          variant="contained"
          startIcon={<CreateIcon sx={{ fontSize: 20 }} />}
          onClick={onWritePost}
          sx={{
            mr: 2,
            position: "relative",
            zIndex: 2,
            borderRadius: "14px",
            fontWeight: 700,
            fontSize: "0.95rem", // 폰트 크기 약간 줄임
            px: 2.5, // 좌우 패딩 줄임
            py: 1.2, // 상하 패딩 줄임
            minWidth: "100px", // 최소 너비 줄임
            height: "44px", // 고정 높이로 다른 버튼들과 맞춤
            textTransform: "none",
            transition: "all 0.3s ease",
            background: "linear-gradient(135deg, #8b5cf6, #06b6d4, #22c55e)",
            color: "white",
            border:
              theme.palette.mode === "dark" ? "2px solid rgba(139, 92, 246, 0.6)" : "2px solid rgba(139, 92, 246, 0.4)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 25px rgba(139, 92, 246, 0.4), 0 0 50px rgba(139, 92, 246, 0.2)"
                : "0 0 25px rgba(139, 92, 246, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1)",
            "&:hover": {
              transform: "translateY(-3px) scale(1.05)",
              background: "linear-gradient(135deg, #7c3aed, #0891b2, #16a34a)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 35px rgba(139, 92, 246, 0.6), 0 0 70px rgba(139, 92, 246, 0.3)"
                  : "0 0 35px rgba(139, 92, 246, 0.4), 0 12px 40px rgba(0, 0, 0, 0.15)",
            },
            "&:active": {
              transform: "translateY(-1px) scale(1.02)",
            },
          }}
        >
          글쓰기
        </Button>
      )}
    </Box>
  );
};

export default ChannelTabNavigation;
