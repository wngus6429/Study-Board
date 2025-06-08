"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Button,
  Avatar,
  Chip,
  useTheme,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Mail as MailIcon,
  Send as SendIcon,
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "../store/messageStore";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  getReceivedMessages,
  getSentMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  updateMessage,
  searchUserByNickname,
} from "../api/messagesApi";
import { Message, SendMessageRequest } from "../types/message";
import Loading from "../components/common/Loading";

const MessagesPage = () => {
  const theme = useTheme();
  const { showMessage } = useMessage();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 로그인 체크
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/channels");
    }
  }, [status, router]);

  // 탭 상태
  const [currentTab, setCurrentTab] = useState(0);

  // 새 쪽지 작성 상태
  const [receiverNickname, setReceiverNickname] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");

  // URL 파라미터에서 받는 사람 닉네임 확인 및 설정
  useEffect(() => {
    if (searchParams) {
      const toNickname = searchParams.get("to");
      if (toNickname) {
        setCurrentTab(2); // 새 쪽지 탭으로 이동
        setReceiverNickname(toNickname); // 닉네임 미리 입력
        showMessage(`${toNickname}님에게 쪽지를 보낼 수 있습니다.`, "info");
      }
    }
  }, [searchParams, showMessage]);

  // 쪽지 상세보기 다이얼로그
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  // 쪽지 수정 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 받은 쪽지 목록 조회
  const {
    data: receivedMessagesData,
    isLoading: receivedLoading,
    error: receivedError,
  } = useQuery({
    queryKey: ["receivedMessages"],
    queryFn: () => getReceivedMessages(1, 20),
    enabled: !!session?.user,
  });

  // 보낸 쪽지 목록 조회
  const {
    data: sentMessagesData,
    isLoading: sentLoading,
    error: sentError,
  } = useQuery({
    queryKey: ["sentMessages"],
    queryFn: () => getSentMessages(1, 20),
    enabled: !!session?.user,
  });

  // 쪽지 보내기 mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: SendMessageRequest) => sendMessage(messageData),
    onSuccess: () => {
      showMessage("쪽지가 성공적으로 전송되었습니다!", "success");
      setReceiverNickname("");
      setMessageTitle("");
      setMessageContent("");
      // 보낸 쪽지 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["sentMessages"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "쪽지 전송에 실패했습니다.";
      showMessage(errorMessage, "error");
    },
  });

  // 쪽지 읽음 처리 mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivedMessages"] });
    },
  });

  // 쪽지 삭제 mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: number) => deleteMessage(messageId),
    onSuccess: () => {
      showMessage("쪽지가 삭제되었습니다.", "success");
      setOpenDetailDialog(false);
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ["receivedMessages"] });
      queryClient.invalidateQueries({ queryKey: ["sentMessages"] });
    },
    onError: () => {
      showMessage("쪽지 삭제에 실패했습니다.", "error");
    },
  });

  // 쪽지 수정 mutation
  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, data }: { messageId: number; data: { title?: string; content?: string } }) =>
      updateMessage(messageId, data),
    onSuccess: (updatedData) => {
      showMessage("쪽지가 수정되었습니다.", "success");
      setIsEditing(false);
      setEditTitle("");
      setEditContent("");

      // selectedMessage 즉시 업데이트
      if (selectedMessage) {
        setSelectedMessage({
          ...selectedMessage,
          title: editTitle,
          content: editContent,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["sentMessages"] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "쪽지 수정에 실패했습니다.";
      showMessage(errorMessage, "error");
    },
  });

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    // 탭 변경 시 선택된 메시지 초기화
    setSelectedMessage(null);
    setOpenDetailDialog(false);
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  // 쪽지 보내기 핸들러
  const handleSendMessage = () => {
    if (!receiverNickname.trim()) {
      showMessage("받는 사람의 닉네임을 입력해주세요.", "warning");
      return;
    }
    if (!messageTitle.trim()) {
      showMessage("제목을 입력해주세요.", "warning");
      return;
    }
    if (!messageContent.trim()) {
      showMessage("내용을 입력해주세요.", "warning");
      return;
    }

    sendMessageMutation.mutate({
      receiverNickname: receiverNickname.trim(),
      title: messageTitle.trim(),
      content: messageContent.trim(),
    });
  };

  // 쪽지 클릭 핸들러
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setOpenDetailDialog(true);
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");

    // 받은 쪽지이고 읽지 않은 쪽지라면 읽음 처리
    if (!message.isRead && currentTab === 0) {
      markAsReadMutation.mutate(message.id);
    }
  };

  // 쪽지 삭제 핸들러
  const handleDeleteMessage = () => {
    if (selectedMessage) {
      deleteMessageMutation.mutate(selectedMessage.id);
    }
  };

  // 쪽지 수정 시작 핸들러
  const handleStartEdit = () => {
    if (selectedMessage) {
      setIsEditing(true);
      setEditTitle(selectedMessage.title);
      setEditContent(selectedMessage.content);
    }
  };

  // 쪽지 수정 취소 핸들러
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  // 쪽지 수정 저장 핸들러
  const handleSaveEdit = () => {
    if (!selectedMessage) return;

    if (!editTitle.trim()) {
      showMessage("제목을 입력해주세요.", "warning");
      return;
    }
    if (!editContent.trim()) {
      showMessage("내용을 입력해주세요.", "warning");
      return;
    }

    updateMessageMutation.mutate({
      messageId: selectedMessage.id,
      data: {
        title: editTitle.trim(),
        content: editContent.trim(),
      },
    });
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  // 로딩 상태 처리
  if (status === "loading") {
    return <Loading />;
  }

  // 로그인하지 않은 경우 null 반환 (리디렉션 처리됨)
  if (!session?.user) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 1000,
          mx: "auto",
          borderRadius: "16px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(45, 48, 71, 0.95) 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow:
            theme.palette.mode === "dark" ? "0 8px 32px rgba(139, 92, 246, 0.15)" : "0 8px 24px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* 헤더 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <MailIcon
              sx={{
                fontSize: 32,
                color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #a78bfa, #22d3ee)"
                    : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              쪽지함
            </Typography>
          </Box>

          {/* 탭 네비게이션 */}
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{
              mb: 3,
              "& .MuiTabs-indicator": {
                background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
              },
            }}
          >
            <Tab
              icon={<InboxIcon />}
              label="받은 쪽지"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
              }}
            />
            <Tab
              icon={<OutboxIcon />}
              label="보낸 쪽지"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
              }}
            />
            <Tab
              icon={<EditIcon />}
              label="새 쪽지"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
              }}
            />
          </Tabs>

          {/* 탭 내용 */}
          {currentTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                받은 쪽지
              </Typography>
              {receivedLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : receivedMessagesData?.messages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <InboxIcon
                    sx={{
                      fontSize: 64,
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                      mb: 2,
                    }}
                  />
                  <Typography color="text.secondary">받은 쪽지가 없습니다.</Typography>
                </Box>
              ) : (
                <List>
                  {receivedMessagesData?.messages.map((message) => (
                    <ListItem
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? message.isRead
                              ? "rgba(45, 48, 56, 0.6)"
                              : "rgba(139, 92, 246, 0.1)"
                            : message.isRead
                              ? "rgba(249, 250, 251, 0.8)"
                              : "rgba(139, 92, 246, 0.05)",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor:
                            theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                          }}
                        >
                          {message.sender.nickname.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: message.isRead ? 400 : 700 }}>
                              {message.title}
                            </Typography>
                            {!message.isRead && (
                              <Chip
                                label="NEW"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  fontWeight: "bold",
                                  background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                                  color: "white",
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              보낸이: {message.sender.nickname}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(message.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                보낸 쪽지
              </Typography>
              {sentLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : sentMessagesData?.messages.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <OutboxIcon
                    sx={{
                      fontSize: 64,
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                      mb: 2,
                    }}
                  />
                  <Typography color="text.secondary">보낸 쪽지가 없습니다.</Typography>
                </Box>
              ) : (
                <List>
                  {sentMessagesData?.messages.map((message) => (
                    <ListItem
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor:
                          theme.palette.mode === "dark" ? "rgba(45, 48, 56, 0.6)" : "rgba(249, 250, 251, 0.8)",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor:
                            theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                          }}
                        >
                          {message.receiver.nickname.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {message.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              받는이: {message.receiver.nickname}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(message.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {currentTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                새 쪽지 작성
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="받는 사람 닉네임"
                  value={receiverNickname}
                  onChange={(e) => setReceiverNickname(e.target.value)}
                  fullWidth
                  placeholder="홍길동"
                  variant="outlined"
                />
                <TextField
                  label="제목"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="내용"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  fullWidth
                  multiline
                  rows={8}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  sx={{
                    alignSelf: "flex-end",
                    px: 4,
                    py: 1.5,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                    fontWeight: 600,
                    "&:hover": {
                      background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                    },
                  }}
                >
                  {sendMessageMutation.isPending ? <CircularProgress size={20} /> : "쪽지 보내기"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 쪽지 상세보기 다이얼로그 */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: theme.palette.mode === "dark" ? "rgba(30, 32, 38, 0.98)" : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(12px)",
          },
        }}
      >
        {selectedMessage && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                borderBottom: `1px solid ${
                  theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                }`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PersonIcon />
                {selectedMessage.title}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {currentTab === 0 ? "보낸이" : "받는이"}:{" "}
                  {currentTab === 0
                    ? selectedMessage.sender?.nickname || "알 수 없음"
                    : selectedMessage.receiver?.nickname || "알 수 없음"}{" "}
                  (
                  {currentTab === 0
                    ? selectedMessage.sender?.user_email || ""
                    : selectedMessage.receiver?.user_email || ""}
                  )
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(selectedMessage.createdAt)}
                </Typography>
              </Box>

              {isEditing ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="제목"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="내용"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                  />
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {selectedMessage.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                    }}
                  >
                    {selectedMessage.content}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={() => setOpenDetailDialog(false)} variant="outlined">
                닫기
              </Button>

              {isEditing ? (
                <>
                  <Button onClick={handleCancelEdit} variant="outlined" color="secondary">
                    취소
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    variant="contained"
                    startIcon={<EditIcon />}
                    disabled={updateMessageMutation.isPending}
                  >
                    저장
                  </Button>
                </>
              ) : (
                <>
                  {/* 보낸 쪽지이고 읽지 않은 경우에만 수정 버튼 표시 */}
                  {currentTab === 1 && !selectedMessage.isRead && (
                    <Button onClick={handleStartEdit} variant="contained" startIcon={<EditIcon />}>
                      수정
                    </Button>
                  )}
                  <Button
                    onClick={handleDeleteMessage}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={deleteMessageMutation.isPending}
                  >
                    삭제
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
