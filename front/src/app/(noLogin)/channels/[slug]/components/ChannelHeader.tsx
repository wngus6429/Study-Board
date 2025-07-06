"use client";

import React from "react";
import { Box, Button, Chip, useTheme } from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  Hub as HubIcon,
  AutoAwesome as AutoAwesomeIcon,
  Diamond as DiamondIcon,
  Bolt as BoltIcon,
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
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channelData, session, formatSubscriberCount }) => {
  const theme = useTheme();
  const router = useRouter();

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
          {`${channelData.creator?.nickname || "알수없음"}님이 만든 채널입니다. 다양한 주제로 소통해보세요! ✨`}
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
