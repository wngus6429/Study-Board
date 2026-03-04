"use client";

import React from "react";
import { Box, Button, CircularProgress, useTheme } from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Announcement as AnnouncementIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";

interface ChannelActionButtonsProps {
  // 상태
  showChat: boolean;
  isSubscribed: boolean;
  isNotificationEnabled: boolean;

  // 로딩 상태
  subscribeMutationPending: boolean;
  unsubscribeMutationPending: boolean;
  notificationSubscribeMutationPending: boolean;
  notificationUnsubscribeMutationPending: boolean;

  // 핸들러들
  onChatToggle: () => void;
  onSubscribeToggle: () => void;
  onNotificationToggle: () => void;
  onShowNotice: () => void;
  onShowChannelInfo: () => void;

  // 유저 세션
  hasSession: boolean;
  isMobileViewOnly?: boolean;
}

const ChannelActionButtons: React.FC<ChannelActionButtonsProps> = ({
  showChat,
  isSubscribed,
  isNotificationEnabled,
  subscribeMutationPending,
  unsubscribeMutationPending,
  notificationSubscribeMutationPending,
  notificationUnsubscribeMutationPending,
  onChatToggle,
  onSubscribeToggle,
  onNotificationToggle,
  onShowNotice,
  onShowChannelInfo,
  hasSession,
  isMobileViewOnly = false,
}) => {
  const theme = useTheme();

  const mobileSecondaryButtonHeight = isMobileViewOnly ? 42 : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        gap: isMobileViewOnly ? 0.75 : 1.5,
        flexDirection: isMobileViewOnly ? "column" : "row",
        width: isMobileViewOnly ? "100%" : "auto",
      }}
    >
      {/* 왼쪽 열: 실시간 채팅 버튼 */}
      {!isMobileViewOnly && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: isMobileViewOnly ? 0.75 : 1,
          }}
        >
          {/* 실시간 채팅 버튼 */}
          <Button
            variant="contained"
            startIcon={<ChatIcon sx={{ fontSize: 22 }} />}
            onClick={onChatToggle}
            sx={{
              minWidth: "130px",
              height: "95px",
              fontSize: "0.95rem",
              fontWeight: 700,
              borderRadius: "16px",
              textTransform: "none",
              transition: "all 0.3s ease",
              background: showChat
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              border: showChat
                ? theme.palette.mode === "dark"
                  ? "2px solid rgba(239, 68, 68, 0.6)"
                  : "2px solid rgba(239, 68, 68, 0.4)"
                : theme.palette.mode === "dark"
                  ? "2px solid rgba(34, 197, 94, 0.6)"
                  : "2px solid rgba(34, 197, 94, 0.4)",
              boxShadow: showChat
                ? theme.palette.mode === "dark"
                  ? "0 8px 32px rgba(239, 68, 68, 0.4)"
                  : "0 8px 28px rgba(239, 68, 68, 0.3)"
                : theme.palette.mode === "dark"
                  ? "0 8px 32px rgba(34, 197, 94, 0.4)"
                  : "0 8px 28px rgba(34, 197, 94, 0.3)",
              "&:hover": {
                transform: "translateY(-3px) scale(1.02)",
                background: showChat
                  ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                  : "linear-gradient(135deg, #16a34a, #15803d)",
                boxShadow: showChat
                  ? theme.palette.mode === "dark"
                    ? "0 12px 40px rgba(239, 68, 68, 0.5)"
                    : "0 12px 35px rgba(239, 68, 68, 0.4)"
                  : theme.palette.mode === "dark"
                    ? "0 12px 40px rgba(34, 197, 94, 0.5)"
                    : "0 12px 35px rgba(34, 197, 94, 0.4)",
              },
              "&:active": {
                transform: "translateY(-1px) scale(0.98)",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.3 }}>
              <Box sx={{ fontSize: "1rem", fontWeight: 800 }}>{showChat ? "채팅 종료" : "실시간채팅"}</Box>
              <Box sx={{ fontSize: "0.7rem", opacity: 0.9, fontWeight: 600 }}>
                {showChat ? "클릭하여 나가기" : "참여하기"}
              </Box>
            </Box>
          </Button>
        </Box>
      )}

      {/* 가운데 열: 공지사항, 채널정보 - 항상 표시 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobileViewOnly ? "row" : "column",
          flexWrap: isMobileViewOnly ? "wrap" : "nowrap",
          gap: 1,
          width: isMobileViewOnly ? "100%" : "auto",
          justifyContent: isMobileViewOnly ? "center" : "flex-start",
          alignItems: isMobileViewOnly ? "center" : "stretch",
          marginTop: isMobileViewOnly ? "4px" : 0,
        }}
      >
        {/* 공지사항 버튼 */}
        <Button
          variant="contained"
          startIcon={<AnnouncementIcon sx={{ fontSize: 20 }} />}
          onClick={onShowNotice}
          sx={{
            minWidth: "120px",
            height: isMobileViewOnly ? mobileSecondaryButtonHeight : "42px",
            flex: isMobileViewOnly ? "1 1 calc(50% - 8px)" : "none",
            fontSize: "0.85rem",
            fontWeight: 700,
            borderRadius: "14px",
            textTransform: "none",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            color: "white",
            border:
              theme.palette.mode === "dark" ? "2px solid rgba(245, 158, 11, 0.5)" : "2px solid rgba(245, 158, 11, 0.3)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 6px 24px rgba(245, 158, 11, 0.4)"
                : "0 6px 20px rgba(245, 158, 11, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px) scale(1.05)",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 8px 32px rgba(245, 158, 11, 0.5)"
                  : "0 8px 28px rgba(245, 158, 11, 0.4)",
            },
            "&:active": {
              transform: "translateY(-1px) scale(1.02)",
            },
          }}
        >
          공지사항
        </Button>

        {/* 채널 정보 버튼 */}
        <Button
          variant="contained"
          startIcon={<PeopleIcon sx={{ fontSize: 18 }} />}
          onClick={onShowChannelInfo}
          sx={{
            minWidth: "120px",
            height: isMobileViewOnly ? mobileSecondaryButtonHeight : "42px",
            flex: isMobileViewOnly ? "1 1 calc(50% - 8px)" : "none",
            fontSize: "0.85rem",
            fontWeight: 700,
            borderRadius: "12px",
            textTransform: "none",
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "white",
            border:
              theme.palette.mode === "dark" ? "2px solid rgba(14, 165, 233, 0.5)" : "2px solid rgba(14, 165, 233, 0.3)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 4px 20px rgba(14, 165, 233, 0.4)"
                : "0 4px 16px rgba(14, 165, 233, 0.3)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px) scale(1.05)",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 6px 28px rgba(14, 165, 233, 0.5)"
                  : "0 6px 24px rgba(14, 165, 233, 0.4)",
            },
            "&:active": {
              transform: "translateY(-1px) scale(1.02)",
            },
          }}
        >
          채널정보
        </Button>
      </Box>

      {/* 오른쪽 열: 구독하기, 알림받기 - 로그인시에만 표시 */}
      {hasSession && (
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobileViewOnly ? "row" : "column",
            flexWrap: isMobileViewOnly ? "wrap" : "nowrap",
            gap: isMobileViewOnly ? 1 : 1,
            width: isMobileViewOnly ? "100%" : "auto",
            justifyContent: isMobileViewOnly ? "center" : "flex-start",
            marginTop: isMobileViewOnly ? 0.5 : 0,
          }}
        >
          {/* 구독하기 버튼 */}
          <Button
            variant="contained"
            onClick={onSubscribeToggle}
            disabled={subscribeMutationPending || unsubscribeMutationPending}
            startIcon={isSubscribed ? <StarIcon sx={{ fontSize: 22 }} /> : <PersonAddIcon sx={{ fontSize: 22 }} />}
            sx={{
              borderRadius: "16px",
              fontWeight: 700,
              px: 2.5,
              py: isMobileViewOnly ? 0 : 1.2,
              minWidth: isMobileViewOnly ? 120 : 120,
              height: isMobileViewOnly ? mobileSecondaryButtonHeight : "42px",
              fontSize: "0.9rem",
              textTransform: "none",
              transition: "all 0.3s ease",
              flex: isMobileViewOnly ? "1 1 calc(50% - 8px)" : "none",
              background: isSubscribed
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "white",
              border: isSubscribed
                ? theme.palette.mode === "dark"
                  ? "2px solid rgba(239, 68, 68, 0.6)"
                  : "2px solid rgba(239, 68, 68, 0.4)"
                : theme.palette.mode === "dark"
                  ? "2px solid rgba(139, 92, 246, 0.6)"
                  : "2px solid rgba(139, 92, 246, 0.4)",
              boxShadow: isSubscribed
                ? theme.palette.mode === "dark"
                  ? "0 6px 28px rgba(239, 68, 68, 0.4)"
                  : "0 6px 24px rgba(239, 68, 68, 0.3)"
                : theme.palette.mode === "dark"
                  ? "0 6px 28px rgba(139, 92, 246, 0.4)"
                  : "0 6px 24px rgba(139, 92, 246, 0.3)",
              "&:hover": {
                transform: "translateY(-3px) scale(1.02)",
                background: isSubscribed
                  ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                  : "linear-gradient(135deg, #7c3aed, #6366f1)",
                boxShadow: isSubscribed
                  ? theme.palette.mode === "dark"
                    ? "0 8px 35px rgba(239, 68, 68, 0.5)"
                    : "0 8px 30px rgba(239, 68, 68, 0.4)"
                  : theme.palette.mode === "dark"
                    ? "0 8px 35px rgba(139, 92, 246, 0.5)"
                    : "0 8px 30px rgba(139, 92, 246, 0.4)",
              },
              "&:active": {
                transform: "translateY(-1px) scale(0.98)",
              },
              "&:disabled": {
                background: isSubscribed
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(220, 38, 38, 0.5))"
                  : "linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(124, 58, 237, 0.5))",
                transform: "none",
                boxShadow: "none",
              },
            }}
          >
            {subscribeMutationPending || unsubscribeMutationPending ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : isSubscribed ? (
              "구독 중"
            ) : (
              "구독하기"
            )}
          </Button>

          {/* 알림받기 버튼 */}
          <Button
            variant="contained"
            startIcon={
              notificationSubscribeMutationPending || notificationUnsubscribeMutationPending ? (
                <CircularProgress size={18} sx={{ color: "inherit" }} />
              ) : isNotificationEnabled ? (
                <NotificationsIcon sx={{ fontSize: 20 }} />
              ) : (
                <NotificationsOffIcon sx={{ fontSize: 20 }} />
              )
            }
            onClick={onNotificationToggle}
            disabled={notificationSubscribeMutationPending || notificationUnsubscribeMutationPending}
            sx={{
              minWidth: isMobileViewOnly ? 120 : 120,
              height: isMobileViewOnly ? mobileSecondaryButtonHeight : "42px",
              fontSize: "0.85rem",
              fontWeight: 700,
              borderRadius: "12px",
              textTransform: "none",
              transition: "all 0.3s ease",
              flex: isMobileViewOnly ? "1 1 calc(50% - 8px)" : "none",
              background: isNotificationEnabled
                ? "linear-gradient(135deg, #f59e0b, #f97316)"
                : "linear-gradient(135deg, #6b7280, #4b5563)",
              color: "white",
              border: isNotificationEnabled
                ? theme.palette.mode === "dark"
                  ? "2px solid rgba(245, 158, 11, 0.5)"
                  : "2px solid rgba(245, 158, 11, 0.3)"
                : theme.palette.mode === "dark"
                  ? "2px solid rgba(107, 114, 128, 0.5)"
                  : "2px solid rgba(107, 114, 128, 0.3)",
              boxShadow: isNotificationEnabled
                ? theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(245, 158, 11, 0.4)"
                  : "0 4px 16px rgba(245, 158, 11, 0.3)"
                : theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(107, 114, 128, 0.3)"
                  : "0 4px 16px rgba(107, 114, 128, 0.2)",
              "&:hover": {
                transform: "translateY(-2px) scale(1.05)",
                background: isNotificationEnabled
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : "linear-gradient(135deg, #4b5563, #374151)",
                boxShadow: isNotificationEnabled
                  ? theme.palette.mode === "dark"
                    ? "0 6px 28px rgba(245, 158, 11, 0.5)"
                    : "0 6px 24px rgba(245, 158, 11, 0.4)"
                  : theme.palette.mode === "dark"
                    ? "0 6px 28px rgba(107, 114, 128, 0.4)"
                    : "0 6px 24px rgba(107, 114, 128, 0.3)",
              },
              "&:active": {
                transform: "translateY(-1px) scale(1.02)",
              },
              "&:disabled": {
                background: isNotificationEnabled
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.5), rgba(249, 115, 22, 0.5))"
                  : "linear-gradient(135deg, rgba(107, 114, 128, 0.5), rgba(75, 85, 99, 0.5))",
                transform: "none",
                boxShadow: "none",
              },
            }}
          >
            {isNotificationEnabled ? "알림 끄기" : "알림 받기"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ChannelActionButtons;
