"use client";

import React from "react";
import { Box, Button, Chip, Typography, useTheme } from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  Hub as HubIcon,
  AutoAwesome as AutoAwesomeIcon,
  Diamond as DiamondIcon,
  Bolt as BoltIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { MetallicAvatar, MetallicTitle, MetallicSubtitle } from "../components";

interface ChannelHeaderProps {
  channelData: {
    channel_name: string;
    story_count: number;
    subscriber_count: number;
    creator?: {
      id: string;
      nickname: string;
    };
  };
  session?: {
    user?: {
      id: string;
    };
  } | null;
  formatSubscriberCount: (count: number) => string;
  isMobileViewOnly?: boolean;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channelData,
  session,
  formatSubscriberCount,
  isMobileViewOnly,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const descriptionText = `${channelData.creator?.nickname || "알수없음"}님이 만든 채널입니다. 다양한 주제로 소통해보세요! ✨`;

  if (isMobileViewOnly) {
    const mobileStats = [
      {
        label: "구독자",
        value: `${formatSubscriberCount(channelData.subscriber_count)}명`,
        icon: (
          <PeopleIcon
            sx={{
              fontSize: 18,
              color: theme.palette.mode === "dark" ? "#a5b4fc" : "#6366f1",
            }}
          />
        ),
      },
      {
        label: "게시글",
        value: `${channelData.story_count.toLocaleString()}개`,
        icon: (
          <ArticleIcon
            sx={{
              fontSize: 18,
              color: theme.palette.mode === "dark" ? "#fbcfe8" : "#ec4899",
            }}
          />
        ),
      },
      // {
      //   label: "방장",
      //   value: channelData.creator?.nickname || "알수없음",
      //   icon: (
      //     <PersonIcon
      //       sx={{
      //         fontSize: 18,
      //         color: theme.palette.mode === "dark" ? "#fcd34d" : "#f59e0b",
      //       }}
      //     />
      //   ),
      // },
    ];

    return (
      <Box
        sx={{
          width: "100%",
          borderRadius: "20px",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(45, 48, 71, 0.95))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98))",
          border:
            theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(99, 102, 241, 0.25)",
          boxShadow:
            theme.palette.mode === "dark" ? "0 12px 30px rgba(0, 0, 0, 0.45)" : "0 12px 30px rgba(15, 23, 42, 0.15)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MetallicTitle
              variant="h6"
              sx={{
                fontSize: "1.35rem",
                lineHeight: 1.2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {channelData.channel_name}
            </MetallicTitle>
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: theme.palette.mode === "dark" ? "#cbd5f5" : "#4b5563",
                lineHeight: 1.4,
              }}
            >
              {descriptionText}
            </Typography>
          </Box>
          <VerifiedIcon
            sx={{
              color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
              fontSize: 24,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
          {mobileStats.map((stat) => (
            <Box
              key={stat.label}
              sx={{
                flex: "1 1 30%",
                minWidth: "120px",
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: "14px",
                backgroundColor: theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.7)" : "rgba(99, 102, 241, 0.08)",
                border:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(148, 163, 184, 0.2)"
                    : "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              {stat.icon}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === "dark" ? "#94a3b8" : "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1f2937",
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <MetallicAvatar>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          {/* 메인 아이콘 */}
          <HubIcon
            sx={{
              fontSize: "2.2rem",
              position: "relative",
              zIndex: 2,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          />

          {/* 배경 장식 아이콘들 */}
          <AutoAwesomeIcon
            sx={{
              position: "absolute",
              top: "8px",
              right: "12px",
              fontSize: "0.8rem",
              opacity: 0.7,
              animation: "sparkle 2s ease-in-out infinite",
              "@keyframes sparkle": {
                "0%, 100%": { opacity: 0.4, transform: "scale(0.8)" },
                "50%": { opacity: 1, transform: "scale(1.2)" },
              },
            }}
          />

          <DiamondIcon
            sx={{
              position: "absolute",
              bottom: "6px",
              left: "8px",
              fontSize: "0.6rem",
              opacity: 0.6,
              animation: "sparkle 2.5s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          />

          <BoltIcon
            sx={{
              position: "absolute",
              top: "6px",
              left: "10px",
              fontSize: "0.7rem",
              opacity: 0.5,
              animation: "sparkle 3s ease-in-out infinite",
              animationDelay: "1s",
            }}
          />
        </Box>
      </MetallicAvatar>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          {/* 채널 이름 컨테이너 */}
          <Box
            sx={{
              position: "relative",
              padding: "8px 16px",
              borderRadius: "12px",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(45, 48, 71, 0.9) 100%)"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)",
              border:
                theme.palette.mode === "dark"
                  ? "2px solid rgba(139, 92, 246, 0.3)"
                  : "2px solid rgba(139, 92, 246, 0.2)",
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 0 20px rgba(139, 92, 246, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            }}
          >
            <MetallicTitle variant="h5" sx={{ position: "relative", zIndex: 2 }}>
              {channelData.channel_name}
            </MetallicTitle>
          </Box>

          <VerifiedIcon
            sx={{
              color: theme.palette.mode === "dark" ? "#22d3ee" : "#06b6d4",
              fontSize: 20,
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          />
          {channelData.story_count > 50 && (
            <Chip
              icon={<TrendingUpIcon />}
              label="HOT"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #ff6b6b, #ff8e53)",
                color: "#ffffff",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)",
              }}
            />
          )}
        </Box>

        <MetallicSubtitle
          variant="body2"
          sx={{
            mb: 1,
            maxWidth: "500px",
            lineHeight: 1.5,
          }}
        >
          {descriptionText}
        </MetallicSubtitle>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleIcon
              sx={{
                fontSize: 16,
                color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
              }}
            />
            <MetallicSubtitle
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              구독자 {formatSubscriberCount(channelData.subscriber_count)}명
            </MetallicSubtitle>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PersonIcon
              sx={{
                fontSize: 16,
                color: theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary",
              }}
            />
            <MetallicSubtitle variant="body2">생성자: {channelData.creator?.nickname || "알수없음"}</MetallicSubtitle>
            {/* 생성자에게 쪽지 보내기 버튼 */}
            {session?.user &&
              channelData.creator &&
              channelData.creator.nickname &&
              session.user.id !== channelData.creator.id && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/messages?to=${channelData.creator.nickname}`)}
                  sx={{
                    ml: 1,
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    minWidth: "auto",
                    borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.5)" : "#8b5cf6",
                    color: theme.palette.mode === "dark" ? "#a78bfa" : "#8b5cf6",
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)",
                    },
                  }}
                >
                  쪽지
                </Button>
              )}
          </Box>

          <MetallicSubtitle variant="body2">게시글 {channelData.story_count.toLocaleString()}개</MetallicSubtitle>
        </Box>
      </Box>
    </Box>
  );
};

export default ChannelHeader;
