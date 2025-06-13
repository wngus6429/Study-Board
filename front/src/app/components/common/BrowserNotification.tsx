"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Box, Button, Card, CardContent, Typography, IconButton, Snackbar, Alert } from "@mui/material";
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

interface BrowserNotificationProps {
  children?: React.ReactNode;
}

const BrowserNotification: React.FC<BrowserNotificationProps> = ({ children }) => {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showPermissionBar, setShowPermissionBar] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    // 브라우저가 Notification API를 지원하는지 확인
    if ("Notification" in window) {
      setPermission(Notification.permission);

      // 로그인되어 있고 권한이 기본값이면 권한 요청 바 표시
      if (session?.user && Notification.permission === "default") {
        setShowPermissionBar(true);
      }
    }
  }, [session]);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        setShowPermissionBar(false);

        if (permission === "granted") {
          setSnackbarMessage("브라우저 알림이 활성화되었습니다! 이제 댓글 알림을 받을 수 있습니다.");
          setSnackbarOpen(true);

          // 테스트 알림 보내기
          showBrowserNotification({
            title: "Study Board 알림 설정 완료",
            body: "이제 새로운 댓글 알림을 받을 수 있습니다!",
            icon: "/icon.png",
          });
        } else if (permission === "denied") {
          setSnackbarMessage("알림 권한이 거부되었습니다. 브라우저 설정에서 변경할 수 있습니다.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error("알림 권한 요청 실패:", error);
      }
    }
  };

  // 브라우저 알림 표시 함수
  const showBrowserNotification = (options: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
    onClick?: () => void;
  }) => {
    if (permission === "granted" && "Notification" in window) {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icon.png",
        badge: "/icon.png",
        tag: "study-board-notification", // 중복 알림 방지
        requireInteraction: false, // 자동으로 사라짐
        data: options.data,
      });

      // 알림 클릭 시 동작
      notification.onclick = () => {
        window.focus(); // 브라우저 창을 포커스
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      // 3초 후 자동으로 닫기
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
    return null;
  };

  // 댓글 알림 생성 (다른 컴포넌트에서 호출 가능)
  const showCommentNotification = (commentData: {
    authorName: string;
    content: string;
    storyId: number;
    commentId: number;
    channelSlug?: string;
  }) => {
    const truncatedContent =
      commentData.content.length > 100 ? commentData.content.substring(0, 100) + "..." : commentData.content;

    return showBrowserNotification({
      title: `${commentData.authorName}님이 댓글을 남겼습니다`,
      body: truncatedContent,
      icon: "/icon.png",
      data: {
        type: "comment",
        storyId: commentData.storyId,
        commentId: commentData.commentId,
        channelSlug: commentData.channelSlug,
      },
      onClick: () => {
        // 해당 게시글로 이동
        const url = commentData.channelSlug
          ? `/channels/${commentData.channelSlug}/detail/story/${commentData.storyId}#comment-${commentData.commentId}`
          : `/detail/story/${commentData.storyId}#comment-${commentData.commentId}`;
        window.location.href = url;
      },
    });
  };

  // 채널 새 게시글 알림 생성 (다른 컴포넌트에서 호출 가능)
  const showChannelPostNotification = (postData: {
    authorName: string;
    title: string;
    channelName: string;
    storyId: number;
    channelSlug: string;
  }) => {
    const truncatedTitle = postData.title.length > 80 ? postData.title.substring(0, 80) + "..." : postData.title;

    return showBrowserNotification({
      title: `${postData.channelName} 채널에 새 게시글이 올라왔습니다`,
      body: `${postData.authorName}: ${truncatedTitle}`,
      icon: "/icon.png",
      data: {
        type: "channel_post",
        storyId: postData.storyId,
        channelSlug: postData.channelSlug,
      },
      onClick: () => {
        // 해당 게시글로 이동
        const url = `/channels/${postData.channelSlug}/detail/story/${postData.storyId}`;
        window.location.href = url;
      },
    });
  };

  // 전역적으로 사용할 수 있도록 window 객체에 함수 추가
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).showCommentNotification = showCommentNotification;
      (window as any).showChannelPostNotification = showChannelPostNotification;
      (window as any).showBrowserNotification = showBrowserNotification;
    }
  }, [permission]);

  return (
    <>
      {children}

      {/* 알림 권한 요청 바 */}
      {showPermissionBar && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: "primary.main",
            color: "white",
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: 1200,
              margin: "0 auto",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <NotificationsIcon />
              <Typography variant="body1">
                새로운 댓글 알림을 받으시겠습니까? 브라우저 알림을 허용하면 실시간으로 알림을 받을 수 있습니다.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={requestNotificationPermission}
                sx={{
                  borderColor: "white",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                  },
                }}
              >
                허용
              </Button>
              <IconButton size="small" onClick={() => setShowPermissionBar(false)} sx={{ color: "white" }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}

      {/* 알림 상태 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={permission === "granted" ? "success" : "warning"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BrowserNotification;
