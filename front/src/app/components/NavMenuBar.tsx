"use client";
import { FC, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Chip,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useChannelPageStore } from "../store/channelPageStore";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const NavMenuBar: FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { subscribedChannels, loading, error, loadSubscriptions, clearSubscriptions } = useSubscriptionStore();
  const { currentChannelSlug, currentPage, currentCategory, stories } = useChannelPageStore();
  const { data: session } = useSession();

  // 현재 경로에서 채널 슬러그와 상세페이지 여부 확인
  const isChannelDetailPage = pathname?.includes("/channels/") && pathname?.includes("/detail/");
  const currentUrlChannelSlug = pathname?.match(/\/channels\/([^\/]+)/)?.[1];

  // 현재 보고 있는 채널의 스토리 목록 표시 여부 결정
  const shouldShowStories = isChannelDetailPage && currentChannelSlug === currentUrlChannelSlug && stories.length > 0;

  useEffect(() => {
    if (session?.user) {
      loadSubscriptions();
    } else {
      clearSubscriptions(); // 로그아웃시 데이터 clear
    }
  }, [session?.user, loadSubscriptions, clearSubscriptions]);

  return (
    <Box
      sx={{
        position: "fixed", // fixed 포지션으로 변경
        top: 300, // TopBar 바로 아래
        left: 20, // 왼쪽에서 20px 떨어진 위치
        display: { xs: "none", sm: "none", md: "none", lg: "flex" }, // 1024px 이하에서는 숨김 (lg 이상에서만 표시)
        flexDirection: "column",
        width: "220px", // 고정 너비
        maxHeight: "calc(100vh - 120px)", // TopBar 높이를 고려한 최대 높이 설정
        overflow: "auto", // 스크롤 가능하게
        bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "rgba(255, 255, 255, 0.95)", // 배경색 (테마에 맞게 조정)
        border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)", // 옅은 테두리
        borderRadius: "12px", // 모서리 둥글게 처리
        boxShadow:
          theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.1)", // 떠 있는 느낌을 주는 그림자 효과
        p: 2, // 내부 패딩
        backdropFilter: "blur(10px)", // 블러 효과 추가
        zIndex: 999, // z-index 설정
      }}
    >
      {/* 구독한 채널 섹션 */}
      <Typography
        variant="subtitle2"
        sx={{
          color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
          fontWeight: 600,
          mb: 1,
          px: 1,
        }}
      >
        구독한 채널
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : subscribedChannels.length > 0 ? (
        <List dense>
          {subscribedChannels.map((channel) => (
            <ListItem key={channel.id} disablePadding>
              <ListItemButton
                component={Link}
                href={`/channels/${channel.slug}`}
                sx={{
                  borderRadius: 1,
                  py: 0.5,
                  "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    mr: 1,
                    fontSize: "0.8rem",
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(6, 182, 212, 0.6))"
                        : "linear-gradient(135deg, #1976d2, #42a5f5)",
                  }}
                >
                  {channel.channel_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {channel.channel_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    {channel.story_count}개 글
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
            px: 1,
            display: "block",
          }}
        >
          구독한 채널이 없습니다
        </Typography>
      )}

      {/* 구분선 */}
      {shouldShowStories && (
        <Divider
          sx={{ my: 2, borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(0, 0, 0, 0.1)" }}
        />
      )}

      {/* 현재 페이지 게시글 목록 섹션 */}
      {shouldShowStories && (
        <>
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
              fontWeight: 600,
              mb: 1,
              px: 1,
            }}
          >
            현재 페이지 ({currentPage}페이지)
          </Typography>

          <List dense>
            {stories.map((story) => (
              <ListItem key={story.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    router.push(`/channels/${currentChannelSlug}/detail/story/${story.id}`);
                  }}
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    px: 1,
                    "&:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.8rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {story.title}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                      <Chip
                        label={story.category === "all" ? "전체" : story.category}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "0.65rem",
                          backgroundColor:
                            theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.1)",
                          color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
                          "& .MuiChip-label": {
                            px: 0.5,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                          fontSize: "0.7rem",
                        }}
                      >
                        {story.nickname}
                      </Typography>
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Typography
            variant="caption"
            sx={{
              color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
              px: 1,
              display: "block",
              textAlign: "center",
              mt: 1,
            }}
          >
            총 {stories.length}개 게시글
          </Typography>
        </>
      )}
    </Box>
  );
};

export default NavMenuBar;
