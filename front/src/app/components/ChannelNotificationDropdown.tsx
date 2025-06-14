"use client";
import React, { useState, useRef, useEffect } from "react";
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, Button, CircularProgress } from "@mui/material";
import FeedIcon from "@mui/icons-material/Feed";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnreadChannelNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../api/notification";
import { INotification } from "../types/notification";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";

const ChannelNotificationDropdown = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: session } = useSession();
  const previousNotificationsRef = useRef<INotification[]>([]);
  const isInitialLoadRef = useRef(true);

  // 읽지 않은 채널 알림 조회
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["unreadChannelNotifications"],
    queryFn: getUnreadChannelNotifications,
    refetchInterval: 15000, // 15초마다 새로고침
    enabled: !!session?.user, // 로그인한 사용자만 조회
  });

  // 새로운 알림 감지 및 브라우저 알림 표시
  useEffect(() => {
    if (!notifications || isInitialLoadRef.current) {
      // 초기 로드시에는 브라우저 알림을 표시하지 않음
      previousNotificationsRef.current = notifications;
      isInitialLoadRef.current = false;
      return;
    }

    const previousNotifications = previousNotificationsRef.current;
    const newNotifications = notifications.filter(
      (current) => !previousNotifications.some((prev) => prev.id === current.id)
    );

    // 새로운 채널 알림이 있으면 브라우저 알림 표시
    if (newNotifications.length > 0) {
      newNotifications.forEach((notification) => {
        if (notification.type === "channel_post") {
          // 채널 새 게시글 알림
          const showChannelPostNotification = (window as any).showChannelPostNotification;
          if (showChannelPostNotification && notification.post) {
            showChannelPostNotification({
              authorName: notification.post.author?.nickname || "알수없음",
              title: notification.post.title,
              channelName: notification.post.channelName || "채널",
              storyId: notification.post.id,
              channelSlug: notification.post.channelSlug || "",
            });
          }
        }
      });
    }

    // 현재 알림 목록을 이전 알림으로 저장
    previousNotificationsRef.current = notifications;
  }, [notifications]);

  // 알림 읽음 처리 mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadChannelNotifications"] });
    },
  });

  // 모든 알림 읽음 처리 mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadChannelNotifications"] });
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

    // 채널 새 게시글 알림 - 게시글로 이동
    if (notification.type === "channel_post") {
      if (notification.post?.id && notification.post?.channelSlug) {
        const url = `/channels/${notification.post.channelSlug}/detail/story/${notification.post.id}`;
        router.push(url);
      }
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
    if (notification.type === "channel_post") {
      const author = notification.post?.author?.nickname || "알 수 없는 사용자";
      const title = notification.post?.title || "";
      const channelName = notification.post?.channelName || "채널";
      const preview = title.length > 30 ? title.substring(0, 30) + "..." : title;

      // 줄바꿈을 위해 JSX 요소로 반환
      return (
        <>
          {channelName}에 {author}님이 새 게시글을 올렸습니다.
          <br />
          {preview}
        </>
      );
    } else {
      return notification.message || "새로운 알림이 있습니다.";
    }
  };

  // 알림 페이지로 이동
  const handleMoveToNotificationPage = () => {
    router.push("/channel-notifications");
  };

  return (
    <>
      {/* 채널 알림 아이콘 버튼 */}
      <IconButton
        size="large"
        aria-label="채널 알림"
        color="inherit"
        onClick={handleOpen}
        sx={{ mr: 1, color: "white" }}
      >
        <Badge badgeContent={notifications.length} color="secondary">
          <FeedIcon />
        </Badge>
      </IconButton>

      {/* 채널 알림 드롭다운 메뉴 */}
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
              width: 350,
              maxHeight: 500,
              overflow: "auto",
            },
          },
        }}
      >
        {/* 헤더 */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            채널 알림
          </Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isPending}>
              모두 읽음
            </Button>
          )}
          <Button size="small" onClick={handleMoveToNotificationPage} sx={{ fontSize: "16px" }}>
            채널 알림 페이지로 이동
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
            <Typography color="text.secondary">새로운 채널 알림이 없습니다</Typography>
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
                router.push("/channel-notifications");
                handleClose();
              }}
              sx={{
                py: 1.5,
                justifyContent: "center",
                color: "primary.main",
              }}
            >
              <Typography variant="body2">모든 채널 알림 보기</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default ChannelNotificationDropdown;
