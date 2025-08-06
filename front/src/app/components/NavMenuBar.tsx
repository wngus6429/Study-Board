"use client";
import { FC, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
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

  // 현재 경로에서 채널 슬러그와 상세페이지 여부 확인 - useMemo로 최적화
  const isChannelDetailPage = useMemo(() => {
    return pathname?.includes("/channels/") && pathname?.includes("/detail/");
  }, [pathname]);

  const currentUrlChannelSlug = useMemo(() => {
    return pathname?.match(/\/channels\/([^\/]+)/)?.[1];
  }, [pathname]);

  // 현재 보고 있는 채널의 스토리 목록 표시 여부 결정 - useMemo로 최적화
  const shouldShowStories = useMemo(() => {
    return isChannelDetailPage && currentChannelSlug === currentUrlChannelSlug && stories.length > 0;
  }, [isChannelDetailPage, currentChannelSlug, currentUrlChannelSlug, stories.length]);

  // useCallback으로 이벤트 핸들러 최적화
  const handleStoryClick = useCallback(
    (storyId: number) => {
      router.push(`/channels/${currentChannelSlug}/detail/story/${storyId}`);
    },
    [router, currentChannelSlug]
  );

  // 스타일 객체들을 useMemo로 최적화
  const containerStyles = useMemo(
    () => ({
      position: "fixed" as const,
      top: 150,
      left: 20,
      display: { xs: "none", sm: "none", md: "none", lg: "flex" },
      flexDirection: "column" as const,
      width: "230px",
      maxHeight: "calc(100vh - 120px)",
      overflow: "auto" as const,
      bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "rgba(255, 255, 255, 0.95)",
      border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
      borderRadius: "12px",
      boxShadow:
        theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
      p: 2,
      backdropFilter: "blur(10px)",
      zIndex: 999,
    }),
    [theme.palette.mode]
  );

  const titleStyles = useMemo(
    () => ({
      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
      fontWeight: 600,
      mb: 1,
      px: 1,
    }),
    [theme.palette.mode]
  );

  const avatarStyles = useMemo(
    () => ({
      width: 24,
      height: 24,
      mr: 1,
      fontSize: "0.8rem",
      background:
        theme.palette.mode === "dark"
          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(6, 182, 212, 0.6))"
          : "linear-gradient(135deg, #1976d2, #42a5f5)",
    }),
    [theme.palette.mode]
  );

  const listItemButtonStyles = useMemo(
    () => ({
      borderRadius: 1,
      py: 0.5,
      "&:hover": {
        backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
      },
    }),
    [theme.palette.mode]
  );

  const storyListItemButtonStyles = useMemo(
    () => ({
      borderRadius: 1,
      py: 0.5,
      px: 1,
      "&:hover": {
        backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(0, 0, 0, 0.04)",
      },
    }),
    [theme.palette.mode]
  );

  const chipStyles = useMemo(
    () => ({
      height: 16,
      fontSize: "0.65rem",
      backgroundColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.1)",
      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
      "& .MuiChip-label": {
        px: 0.5,
      },
    }),
    [theme.palette.mode]
  );

  const dividerStyles = useMemo(
    () => ({
      my: 2,
      borderColor: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(0, 0, 0, 0.1)",
    }),
    [theme.palette.mode]
  );

  useEffect(() => {
    if (session?.user) {
      loadSubscriptions();
    } else {
      clearSubscriptions(); // 로그아웃시 데이터 clear
    }
  }, [session?.user, loadSubscriptions, clearSubscriptions]);

  return (
    <Box sx={containerStyles}>
      {/* 구독한 채널 섹션 */}
      <Typography variant="subtitle2" sx={titleStyles}>
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
              <ListItemButton component={Link} href={`/channels/${channel.slug}`} sx={listItemButtonStyles}>
                <Avatar sx={avatarStyles}>{channel.channel_name.charAt(0)}</Avatar>
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
      {shouldShowStories && <Divider sx={dividerStyles} />}

      {/* 현재 페이지 게시글 목록 섹션 */}
      {shouldShowStories && (
        <>
          <Typography variant="subtitle2" sx={titleStyles}>
            현재 페이지 ({currentPage}페이지)
          </Typography>

          <List dense>
            {stories.map((story) => (
              <ListItem key={story.id} disablePadding>
                <ListItemButton onClick={() => handleStoryClick(story.id)} sx={storyListItemButtonStyles}>
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
                      <Chip label={story.category === "all" ? "전체" : story.category} size="small" sx={chipStyles} />
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
