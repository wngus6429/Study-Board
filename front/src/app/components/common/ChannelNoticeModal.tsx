import React from "react";
import { Box, Typography, Card, Button, Chip, useTheme } from "@mui/material";
import { Announcement as AnnouncementIcon, Edit as EditIcon, FiberNew as FiberNewIcon } from "@mui/icons-material";
import { useSession } from "next-auth/react";

interface ChannelNoticeModalProps {
  channelData: {
    id: number;
    channel_name: string;
    creator?: {
      id: string;
      nickname: string;
    };
  };
  channelNotices: any[];
  noticesLoading: boolean;
  onNoticeClick: (noticeId: number) => void;
  onWriteNotice: () => void;
}

const ChannelNoticeModal: React.FC<ChannelNoticeModalProps> = ({
  channelData,
  channelNotices,
  noticesLoading,
  onNoticeClick,
  onWriteNotice,
}) => {
  const theme = useTheme();
  const { data: session } = useSession();

  // 공지사항 관련 헬퍼 함수들
  const isNewNotice = (createdAt: string) => {
    const noticeDate = new Date(createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return noticeDate > threeDaysAgo;
  };

  const truncateTitle = (title: string, maxLength: number = 35) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <Card
      sx={{
        borderRadius: "16px",
        background: theme.palette.mode === "dark" ? "rgba(30, 32, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        border:
          theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(139, 92, 246, 0.15)",
        boxShadow: theme.palette.mode === "dark" ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 헤더 섹션 */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          {/* 왼쪽: 제목과 설명 */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <AnnouncementIcon sx={{ color: "#8b5cf6" }} />
              {channelData.channel_name} 채널 공지사항
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                fontSize: "0.875rem",
              }}
            >
              채널의 최신 공지사항을 확인하세요
            </Typography>
          </Box>

          {/* 오른쪽: 공지사항 작성 버튼 */}
          {session?.user && channelData.creator?.id === session.user.id && (
            <Button
              onClick={onWriteNotice}
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                borderRadius: "12px",
                px: 3,
                py: 1.5,
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                color: "white",
                fontWeight: "600",
                fontSize: "0.9rem",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              새 공지사항 작성
            </Button>
          )}
        </Box>
      </Box>

      {/* 공지사항 목록 */}
      <Box sx={{ px: 3, pb: 3, maxHeight: "400px", overflowY: "auto" }}>
        {noticesLoading ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                fontStyle: "italic",
              }}
            >
              공지사항을 불러오는 중...
            </Typography>
          </Box>
        ) : channelNotices.length > 0 ? (
          channelNotices.map((notice: any) => (
            <Box
              key={notice.id}
              onClick={() => onNoticeClick(notice.id)}
              sx={{
                borderRadius: "8px",
                p: 2,
                mb: 1,
                backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                border:
                  theme.palette.mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s ease",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                  transform: "translateX(4px)",
                  borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.2)",
                },
                "&:last-child": {
                  mb: 0,
                },
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === "dark" ? "#ffffff" : "#1a1a2e",
                      fontSize: "0.95rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {truncateTitle(notice.title)}
                  </Typography>
                  {isNewNotice(notice.created_at) && (
                    <Chip
                      icon={<FiberNewIcon sx={{ fontSize: "0.8rem" }} />}
                      label="NEW"
                      size="small"
                      sx={{
                        height: "22px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        backgroundColor: "#8b5cf6",
                        color: "white",
                        "& .MuiChip-icon": {
                          color: "white",
                        },
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                    fontSize: "0.8rem",
                  }}
                >
                  {new Date(notice.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <AnnouncementIcon
              sx={{
                fontSize: "3rem",
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
                mb: 2,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                fontStyle: "italic",
              }}
            >
              등록된 공지사항이 없습니다
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ChannelNoticeModal;
