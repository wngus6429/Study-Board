"use client";
import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  CircularProgress,
  Pagination,
  Button,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getAllNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from "../api/notification";
import { INotification } from "../types/notification";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { NOTIFICATION_VIEW_COUNT } from "../const/VIEW_COUNT";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // 모든 알림 조회 (항상 최상단에서 호출, enabled 옵션 사용)
  const { data, isLoading, error } = useQuery({
    queryKey: ["allNotifications", page],
    queryFn: () => getAllNotifications(page, NOTIFICATION_VIEW_COUNT),
    enabled: !!session?.user && status === "authenticated",
  });

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  // 모든 알림 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  // 알림 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });

  // 로그인 체크
  if (status === "loading") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: INotification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    if (notification.comment?.storyId) {
      const url = `/detail/story/${notification.comment.storyId}#comment-${notification.comment.id}`;
      router.push(url);
    }
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
    const preview = content.length > 100 ? content.substring(0, 100) + "..." : content;

    if (notification.type === "comment") {
      return {
        title: `${author}님이 회원님의 글에 댓글을 남겼습니다`,
        content: preview,
      };
    } else {
      return {
        title: `${author}님이 회원님의 댓글에 답글을 남겼습니다`,
        content: preview,
      };
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">알림을 불러오는 중 오류가 발생했습니다.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* 헤더 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            알림
          </Typography>
          {data && data.items.some((item) => !item.isRead) && (
            <Button
              variant="outlined"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              모두 읽음으로 표시
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 알림 목록 */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : !data || data.items.length === 0 ? (
          <Box py={5} textAlign="center">
            <Typography color="text.secondary">알림이 없습니다.</Typography>
          </Box>
        ) : (
          <>
            <List>
              {data.items.map((notification, index) => {
                const { title, content } = formatNotificationMessage(notification);
                return (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        cursor: "pointer",
                        backgroundColor: notification.isRead ? "transparent" : "action.hover",
                        "&:hover": {
                          backgroundColor: "action.selected",
                        },
                        borderRadius: 1,
                        mb: 1,
                      }}
                      onClick={() => handleNotificationClick(notification)}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight={notification.isRead ? "normal" : "bold"}>
                              {title}
                            </Typography>
                            {!notification.isRead && <Chip label="새 알림" size="small" color="primary" />}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {content}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(notification.createdAt)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < data.items.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>

            {/* 페이지네이션 */}
            {data.totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination count={data.totalPages} page={page} onChange={handlePageChange} color="primary" />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
