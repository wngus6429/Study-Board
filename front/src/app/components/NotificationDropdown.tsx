"use client";
import React, { useState, useEffect } from "react";
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, Button, CircularProgress } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../api/notification";
import { INotification } from "../types/notification";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";

const NotificationDropdown = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: session } = useSession();

  // 읽지 않은 알림 조회
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: getUnreadNotifications,
    refetchInterval: 30000, // 30초마다 새로고침
    enabled: !!session?.user, // 로그인한 사용자만 조회
  });

  // 알림 읽음 처리 mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  // 모든 알림 읽음 처리 mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  // 메뉴 열기
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // 메뉴 닫기
  const handleClose = () => {
    setAnchorEl(null);
  };

  // 알림 클릭 시 해당 게시글로 이동하고 읽음 처리
  const handleNotificationClick = async (notification: INotification) => {
    // 읽음 처리
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // 해당 게시글로 이동 (댓글 ID를 해시로 포함)
    if (notification.comment?.storyId) {
      const url = `/detail/story/${notification.comment.storyId}#comment-${notification.comment.id}`;
      router.push(url);
    }

    handleClose();
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  // 알림 메시지 포맷팅
  const formatNotificationMessage = (notification: INotification) => {
    const author = notification.comment?.author.nickname || "알 수 없는 사용자";
    const content = notification.comment?.content || "";
    const preview = content.length > 50 ? content.substring(0, 50) + "..." : content;

    if (notification.type === "comment") {
      return `${author}님이 회원님의 글에 댓글을 남겼습니다: "${preview}"`;
    } else {
      return `${author}님이 회원님의 댓글에 답글을 남겼습니다: "${preview}"`;
    }
  };

  // 알림 페이지로 이동
  const handleMoveToNotificationPage = () => {
    router.push("/notifications");
  };

  return (
    <>
      {/* 알림 아이콘 버튼 */}
      <IconButton size="large" aria-label="알림" color="inherit" onClick={handleOpen} sx={{ mr: 1, color: "white" }}>
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* 알림 드롭다운 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxHeight: 500,
              overflow: "auto",
            },
          },
        }}
      >
        {/* 헤더 */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            알림
          </Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isPending}>
              모두 읽음
            </Button>
          )}
          <Button size="small" onClick={handleMoveToNotificationPage} sx={{ fontSize: "16px" }}>
            알림 페이지로 이동
          </Button>
        </Box>
        <Divider />

        {/* 알림 목록 */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            <Typography color="text.secondary">새로운 알림이 없습니다</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                py: 2,
                px: 2,
                display: "block",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: notification.isRead ? "normal" : "bold",
                    mb: 0.5,
                  }}
                >
                  {formatNotificationMessage(notification)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(notification.createdAt)}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}

        {/* 모든 알림 보기 링크 */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                router.push("/notifications");
                handleClose();
              }}
              sx={{
                py: 1.5,
                justifyContent: "center",
                color: "primary.main",
              }}
            >
              <Typography variant="body2">모든 알림 보기</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationDropdown;
