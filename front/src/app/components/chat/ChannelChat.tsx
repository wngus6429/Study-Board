"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  Avatar,
  IconButton,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Chat as ChatIcon, Send as SendIcon } from "@mui/icons-material";
import { useSession } from "next-auth/react";

// 채팅 API import
import {
  getChannelChatMessages,
  sendChannelChatMessage,
  joinChannelChat,
  leaveChannelChat,
  ChannelChatMessage,
} from "@/app/api/channelChatApi";

// 웹소켓 import
import { ChannelChatWebSocket, WebSocketStatus } from "@/app/utils/websocket";

interface ChannelChatProps {
  channelId: number;
  channelName: string;
  showMessage: (message: string, type: "success" | "error" | "warning" | "info") => void;
  onClose: () => void;
}

const ChannelChat: React.FC<ChannelChatProps> = ({ channelId, channelName, showMessage, onClose }) => {
  const theme = useTheme();
  const { data: session } = useSession();

  // 채팅 상태 관리
  const [chatMessages, setChatMessages] = useState<ChannelChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [wsConnection, setWsConnection] = useState<ChannelChatWebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("disconnected");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; nickname: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; nickname: string }[]>([]);

  // 스크롤 자동 이동을 위한 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 시 채팅 초기화
  useEffect(() => {
    if (channelId && session?.user) {
      loadChatMessages();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [channelId, session?.user]);

  // 채널 변경 시 웹소켓 재연결
  useEffect(() => {
    if (channelId && wsConnection) {
      disconnectWebSocket();
      loadChatMessages();
    }
  }, [channelId]);

  // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // 스크롤을 맨 아래로 이동시키는 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 채팅 메시지 로드 및 웹소켓 연결
  const loadChatMessages = async () => {
    if (!channelId || !session?.user) return;

    setIsLoadingMessages(true);

    try {
      // API로 기존 채팅 메시지 로드
      console.log("📥 채팅 메시지 로드 시작");
      const response = await getChannelChatMessages(channelId, 1, 50);
      setChatMessages(response.messages);

      // 채널 입장 알림
      await joinChannelChat(channelId);

      // 웹소켓 연결 설정
      if (!wsConnection) {
        setupWebSocketConnection();
      }

      console.log("✅ 채팅 로드 완료:", response.messages.length, "개 메시지");
    } catch (error) {
      console.error("❌ 채팅 메시지 로드 실패:", error);
      showMessage("채팅을 불러오는데 실패했습니다.", "error");

      // 에러 시 더미 데이터 표시 (개발용)
      const dummyMessages: ChannelChatMessage[] = [
        {
          id: 1,
          channel_id: channelId,
          user_id: "1",
          user: {
            id: "1",
            nickname: "김개발자",
            user_email: "dev@example.com",
            profile_image: "",
          },
          message: "안녕하세요! 이 채널 정말 유용하네요 👍",
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          channel_id: channelId,
          user_id: "2",
          user: {
            id: "2",
            nickname: "박프론트",
            user_email: "frontend@example.com",
            profile_image: "",
          },
          message: "React 관련 질문이 있는데 괜찮을까요?",
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
      ];
      setChatMessages(dummyMessages);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 웹소켓 연결 설정
  const setupWebSocketConnection = () => {
    if (!channelId || wsConnection || !session?.user) return;

    console.log("🔌 웹소켓 연결 설정 시작");

    const userInfo = {
      id: session.user.id,
      nickname: session.user.nickname || session.user.name || "사용자",
    };

    const ws = new ChannelChatWebSocket(
      channelId,
      {
        onMessage: (message: ChannelChatMessage) => {
          console.log("📨 새 메시지 수신:", message);
          setChatMessages((prev) => {
            // 중복 메시지 방지
            const exists = prev.find((m) => m.id === message.id);
            if (!exists) {
              return [...prev, message];
            }
            return prev;
          });
        },

        onUserJoined: (user) => {
          console.log("👋 사용자 입장:", user);

          // 자신의 입장은 메시지로 표시하지 않음
          if (user.id !== session?.user?.id) {
            setOnlineUsers((prev) => {
              if (!prev.find((u) => u.id === user.id)) {
                return [...prev, user];
              }
              return prev;
            });
            showMessage(`${user.nickname}님이 채팅에 참여했습니다.`, "info");
          }
        },

        onUserLeft: (user) => {
          console.log("👋 사용자 퇴장:", user);

          // 자신의 퇴장은 메시지로 표시하지 않음
          if (user.id !== session?.user?.id) {
            setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
            showMessage(`${user.nickname}님이 채팅을 나갔습니다.`, "info");
          }
        },

        onTyping: (user) => {
          setTypingUsers((prev) => {
            if (!prev.find((u) => u.id === user.id)) {
              const newTyping = [...prev, user];
              // 3초 후 타이핑 상태 제거
              setTimeout(() => {
                setTypingUsers((current) => current.filter((u) => u.id !== user.id));
              }, 3000);
              return newTyping;
            }
            return prev;
          });
        },

        onStatusChange: (status) => {
          console.log("🔄 웹소켓 상태 변경:", status);
          setWsStatus(status);

          // 연결 상태에 따른 사용자 피드백
          switch (status) {
            case "connecting":
              showMessage("채팅 서버에 연결 중입니다...", "info");
              break;
            case "connected":
              showMessage("채팅 서버에 연결되었습니다.", "success");
              break;
            case "disconnected":
              showMessage("채팅 서버 연결이 끊어졌습니다.", "warning");
              setOnlineUsers([]); // 연결 끊어지면 온라인 사용자 목록 초기화
              break;
            case "error":
              showMessage("채팅 서버 연결에 문제가 발생했습니다.", "error");
              break;
          }
        },

        onError: (error) => {
          console.error("❌ 웹소켓 에러:", error);
          showMessage(error, "error");
        },
      },
      userInfo
    );

    // 연결 시도
    ws.connect();
    setWsConnection(ws);

    // 연결 상태 모니터링 (60초마다)
    const connectionMonitor = setInterval(() => {
      const status = ws.getStatus();
      const isConnected = ws.isConnected();

      console.log(`🔍 연결 상태 체크: ${status}, 연결됨: ${isConnected}`);

      // 연결이 끊어져 있고, 재연결 시도 중이 아닐 때만 재연결
      if (!isConnected && status !== "connecting" && status !== "error") {
        console.warn("⚠️ 웹소켓 연결 끊어짐 - 재연결 시도");
        ws.connect().catch((error) => {
          console.error("❌ 모니터링 재연결 실패:", error);
        });
      }
    }, 60000);

    // 컴포넌트 언마운트 시 모니터링 정리
    return () => {
      clearInterval(connectionMonitor);
    };
  };

  // 웹소켓 연결 해제
  const disconnectWebSocket = async () => {
    if (wsConnection) {
      wsConnection.disconnect();
      setWsConnection(null);
    }

    if (channelId) {
      try {
        await leaveChannelChat(channelId);
      } catch (error) {
        console.error("채널 나가기 실패:", error);
      }
    }

    setOnlineUsers([]);
    setTypingUsers([]);
  };

  // 채팅 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user || !channelId) return;

    try {
      // 웹소켓으로 실시간 전송 (연결되어 있다면)
      if (wsConnection && wsConnection.isConnected()) {
        wsConnection.sendMessage(newMessage.trim());
        setNewMessage("");
        return;
      }

      // 웹소켓이 없으면 API로 전송
      console.log("📤 API로 메시지 전송");
      const response = await sendChannelChatMessage(channelId, newMessage.trim());

      // 성공하면 로컬 상태에 추가
      setChatMessages((prev) => [...prev, response.chatMessage]);
      setNewMessage("");

      console.log("✅ 메시지 전송 완료");
    } catch (error) {
      console.error("❌ 메시지 전송 실패:", error);
      showMessage("메시지 전송에 실패했습니다.", "error");
    }
  };

  // 채팅 메시지 입력 핸들러
  const handleMessageKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        background: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "#ffffff",
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 2,
        boxShadow:
          theme.palette.mode === "dark" ? "0 4px 20px rgba(139, 92, 246, 0.15)" : "0 4px 12px rgba(0,0,0,0.08)",
        height: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 채팅 헤더 */}
      <Box
        sx={{
          p: 2,
          borderBottom:
            theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))"
              : "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChatIcon
          sx={{
            color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
            fontSize: 24,
            mr: 1,
          }}
        />
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #a78bfa, #22d3ee)"
                  : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {channelName} 채널 자유채팅
          </Typography>

          {/* 연결 상태 및 온라인 사용자 표시 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? "#f59e0b" : "#ef4444",
                  boxShadow: `0 0 8px ${
                    wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? "#f59e0b" : "#ef4444"
                  }`,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                  fontSize: "0.75rem",
                }}
              >
                {wsStatus === "connected" ? "실시간 연결됨" : wsStatus === "connecting" ? "연결 중..." : "연결 끊김"}
              </Typography>
            </Box>

            {onlineUsers.length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                  fontSize: "0.75rem",
                }}
              >
                온라인: {onlineUsers.length}명
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* 채팅 메시지 목록 */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List
          sx={{
            flexGrow: 1,
            overflow: "auto",
            py: 1,
            px: 0,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              borderRadius: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.3)",
              borderRadius: "6px",
              "&:hover": {
                background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.7)" : "rgba(139, 92, 246, 0.5)",
              },
            },
          }}
        >
          {chatMessages.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <ChatIcon
                sx={{
                  fontSize: "4rem",
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                첫 메시지를 남겨보세요!
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
                  fontStyle: "italic",
                }}
              >
                이 채널의 다른 사용자들과 자유롭게 대화해보세요
              </Typography>
            </Box>
          ) : (
            chatMessages.map((message, index) => {
              // 내가 보낸 메시지인지 확인
              const isMyMessage = message.user.id === session?.user?.id;

              return (
                <React.Fragment key={message.id}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: isMyMessage ? "flex-end" : "flex-start",
                      px: 3,
                      py: 1.5,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: isMyMessage ? "row-reverse" : "row",
                        alignItems: "flex-start",
                        gap: 1.5,
                        maxWidth: "75%",
                      }}
                    >
                      {/* 아바타 */}
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          background: isMyMessage
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          boxShadow: isMyMessage
                            ? theme.palette.mode === "dark"
                              ? "0 2px 8px rgba(16, 185, 129, 0.3)"
                              : "0 2px 8px rgba(16, 185, 129, 0.2)"
                            : theme.palette.mode === "dark"
                              ? "0 2px 8px rgba(139, 92, 246, 0.3)"
                              : "0 2px 8px rgba(139, 92, 246, 0.2)",
                        }}
                        src={
                          message.user.profile_image
                            ? `${process.env.NEXT_PUBLIC_BASE_URL}${message.user.profile_image}`
                            : undefined
                        }
                      >
                        {message.user.nickname.charAt(0)}
                      </Avatar>

                      {/* 메시지 내용 */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMyMessage ? "flex-end" : "flex-start",
                          gap: 0.5,
                        }}
                      >
                        {/* 사용자 이름과 시간 */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexDirection: isMyMessage ? "row-reverse" : "row",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: isMyMessage
                                ? theme.palette.mode === "dark"
                                  ? "#34d399"
                                  : "#059669"
                                : theme.palette.mode === "dark"
                                  ? "#a78bfa"
                                  : "#8b5cf6",
                              fontSize: "0.85rem",
                            }}
                          >
                            {isMyMessage ? "나" : message.user.nickname}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                              fontSize: "0.75rem",
                            }}
                          >
                            {new Date(message.created_at).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>

                        {/* 메시지 버블 */}
                        <Box
                          sx={{
                            background: isMyMessage
                              ? theme.palette.mode === "dark"
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #34d399, #10b981)"
                              : theme.palette.mode === "dark"
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(0, 0, 0, 0.04)",
                            color: isMyMessage ? "#ffffff" : theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                            px: 2,
                            py: 1.5,
                            borderRadius: isMyMessage ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                            boxShadow: isMyMessage
                              ? theme.palette.mode === "dark"
                                ? "0 2px 12px rgba(16, 185, 129, 0.2)"
                                : "0 2px 12px rgba(16, 185, 129, 0.15)"
                              : theme.palette.mode === "dark"
                                ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                                : "0 2px 8px rgba(0, 0, 0, 0.1)",
                            border: isMyMessage
                              ? "none"
                              : theme.palette.mode === "dark"
                                ? "1px solid rgba(255, 255, 255, 0.1)"
                                : "1px solid rgba(0, 0, 0, 0.08)",
                            position: "relative",
                            "&::before": isMyMessage
                              ? {
                                  content: '""',
                                  position: "absolute",
                                  bottom: 0,
                                  right: -8,
                                  width: 0,
                                  height: 0,
                                  borderLeft: "8px solid",
                                  borderLeftColor: theme.palette.mode === "dark" ? "#059669" : "#10b981",
                                  borderTop: "8px solid transparent",
                                }
                              : {
                                  content: '""',
                                  position: "absolute",
                                  bottom: 0,
                                  left: -8,
                                  width: 0,
                                  height: 0,
                                  borderRight: "8px solid",
                                  borderRightColor:
                                    theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                                  borderTop: "8px solid transparent",
                                },
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.4,
                              wordBreak: "break-word",
                              whiteSpace: "pre-wrap",
                              fontSize: "0.9rem",
                              fontWeight: isMyMessage ? 500 : 400,
                            }}
                          >
                            {message.message}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* 메시지 간 간격 */}
                  {index < chatMessages.length - 1 && <Box sx={{ height: 8 }} />}
                </React.Fragment>
              );
            })
          )}

          {/* 타이핑 상태 표시 */}
          {typingUsers.length > 0 && (
            <Box
              sx={{
                px: 3,
                py: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  maxWidth: "75%",
                }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  {typingUsers[0].nickname.charAt(0)}
                </Avatar>
                <Box
                  sx={{
                    background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                    px: 2,
                    py: 1,
                    borderRadius: "20px 20px 20px 4px",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.08)",
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      bottom: 0,
                      left: -8,
                      width: 0,
                      height: 0,
                      borderRight: "8px solid",
                      borderRightColor:
                        theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                      borderTop: "8px solid transparent",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                        fontSize: "0.85rem",
                        fontStyle: "italic",
                      }}
                    >
                      {typingUsers.length === 1
                        ? `${typingUsers[0].nickname}님이 입력 중`
                        : `${typingUsers[0].nickname}님 외 ${typingUsers.length - 1}명이 입력 중`}
                    </Typography>
                    {/* 타이핑 애니메이션 점들 */}
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            backgroundColor: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                            animation: "typing 1.4s infinite ease-in-out",
                            animationDelay: `${i * 0.2}s`,
                            "@keyframes typing": {
                              "0%, 80%, 100%": {
                                opacity: 0.3,
                                transform: "scale(0.8)",
                              },
                              "40%": {
                                opacity: 1,
                                transform: "scale(1)",
                              },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* 스크롤 자동 이동을 위한 더미 div */}
          <div ref={messagesEndRef} />
        </List>

        {/* 메시지 입력 영역 */}
        <Box
          sx={{
            p: 3,
            borderTop:
              theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(6, 182, 212, 0.05))"
                : "linear-gradient(135deg, rgba(139, 92, 246, 0.02), rgba(6, 182, 212, 0.02))",
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);

              // 타이핑 상태 전송 (디바운싱)
              if (wsConnection && wsConnection.isConnected() && e.target.value.trim()) {
                wsConnection.sendTyping();
              }
            }}
            onKeyPress={handleMessageKeyPress}
            placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)",
                fontSize: "1rem",
                "& fieldset": {
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)",
                },
                "&:hover fieldset": {
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "rgba(139, 92, 246, 0.4)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputBase-input": {
                color: theme.palette.mode === "dark" ? "#e2e8f0" : "#374151",
                fontSize: "1rem",
                py: 1.5,
              },
              "& .MuiInputBase-input::placeholder": {
                color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                opacity: 1,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    sx={{
                      color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                      background:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                      borderRadius: "12px",
                      p: 1,
                      "&:hover": {
                        background:
                          theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
                        transform: "scale(1.05)",
                      },
                      "&:disabled": {
                        color: theme.palette.mode === "dark" ? "#4a5568" : "#a0aec0",
                        background: "transparent",
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ChannelChat;
