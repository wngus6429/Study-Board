"use client";
import { FC, useEffect, useMemo, useCallback, memo, useState } from "react";
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
  Button,
  Drawer,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useChannelPageStore } from "../store/channelPageStore";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useBlindStore } from "../store/blindStore";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getChannelBySlug } from "@/app/api/channelsApi";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const NavMenuBar: FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { subscribedChannels, loading, error, loadSubscriptions, clearSubscriptions } = useSubscriptionStore();
  const { currentChannelSlug, currentPage, currentCategory, stories } = useChannelPageStore();
  const { data: session } = useSession();
  const { isUserBlinded } = useBlindStore();
  // Nav 전용 페이지 상태 (메인과 분리)
  const [navPage, setNavPage] = useState<number>(currentPage || 1);
  const isCompactLayout = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const closeDrawerIfNeeded = useCallback(() => {
    if (isCompactLayout) {
      setMobileDrawerOpen(false);
    }
  }, [isCompactLayout]);

  // 현재 경로에서 채널 슬러그와 상세페이지 여부 확인 - useMemo로 최적화
  const pathInfo = useMemo(() => {
    const isChannelDetailPage = pathname?.includes("/channels/") && pathname?.includes("/detail/");
    const currentUrlChannelSlug = pathname?.match(/\/channels\/([^\/]+)/)?.[1];
    return { isChannelDetailPage, currentUrlChannelSlug };
  }, [pathname]);

  // 현재 보고 있는 채널의 스토리 목록 표시 여부 결정 - useMemo로 최적화
  const shouldShowStories = useMemo(() => {
    return pathInfo.isChannelDetailPage && currentChannelSlug === pathInfo.currentUrlChannelSlug && stories.length > 0;
  }, [pathInfo.isChannelDetailPage, currentChannelSlug, pathInfo.currentUrlChannelSlug, stories.length]);

  // 채널 ID 조회 (slug 기준) - Nav 전용 페치
  const { data: channelData } = useQuery({
    queryKey: ["nav", "channel", pathInfo.currentUrlChannelSlug],
    queryFn: () => getChannelBySlug(pathInfo.currentUrlChannelSlug || ""),
    enabled: !!pathInfo.currentUrlChannelSlug && !!shouldShowStories,
    // staleTime: 5 * 60 * 1000,
  });

  // Nav 전용 스토리 목록 페치 (메인과 독립)
  const navLimit = useMemo(() => (stories?.length && stories.length > 0 ? stories.length : 20), [stories?.length]);
  const { data: navStoriesData, isLoading: navLoading } = useQuery<{ results: any[]; total: number }>({
    queryKey: ["nav", "stories", pathInfo.currentUrlChannelSlug, channelData?.id, currentCategory, navPage, navLimit],
    queryFn: async () => {
      const offset = (navPage - 1) * navLimit;
      const params: any = {
        offset,
        limit: navLimit,
      };
      if (currentCategory && currentCategory !== "all") params.category = currentCategory;
      if (channelData?.id) params.channelId = channelData.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/story/pageTableData`, { params });
      return response.data;
    },
    enabled: !!channelData?.id && !!shouldShowStories,
    // staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // 총 페이지 수 계산 (total과 navLimit 기반)
  const totalPages = useMemo(() => {
    if (typeof navStoriesData?.total === "number") {
      return Math.max(1, Math.ceil(navStoriesData.total / navLimit));
    }
    return null; // total 정보가 없을 때는 null 유지
  }, [navStoriesData?.total, navLimit]);

  // 현재 페이지가 총 페이지를 넘어가지 않도록 보정
  useEffect(() => {
    if (totalPages && navPage > totalPages) {
      setNavPage(totalPages);
    }
  }, [totalPages]);

  // useCallback으로 이벤트 핸들러 최적화
  const handleStoryClick = useCallback(
    (storyId: number) => {
      // 상세 진입 전, 이전 메인(채널 테이블) URL을 세션 스토리지에 저장
      if (typeof window !== "undefined") {
        const slug = currentChannelSlug || pathInfo.currentUrlChannelSlug || "";
        const params = new URLSearchParams();
        if (currentCategory) params.set("category", currentCategory);
        if (navPage) params.set("page", String(navPage));
        const backUrl = `/channels/${slug}${params.toString() ? `?${params.toString()}` : ""}`;
        sessionStorage.setItem("previousMainPageUrl", backUrl);
      }
      router.push(`/channels/${currentChannelSlug}/detail/story/${storyId}`);
    },
    [router, currentChannelSlug, pathInfo.currentUrlChannelSlug, currentCategory, navPage]
  );
  const handleStorySelect = useCallback(
    (storyId: number) => {
      handleStoryClick(storyId);
      closeDrawerIfNeeded();
    },
    [handleStoryClick, closeDrawerIfNeeded]
  );

  // 스타일 객체들을 useMemo로 최적화
  const containerStyles = useMemo(
    () => ({
      /* 모바일: 숨김, 태블릿/노트북: 블록(정적 위치), 초대형 화면: 고정 사이드 */
      position: { xs: "static", sm: "static", md: "static", lg: "static", xl: "fixed" } as const,
      top: { xl: 150 },
      left: { xl: 20 },
      display: { xs: "none", sm: "block", md: "block", lg: "block", xl: "flex" },
      flexDirection: "column" as const,
      width: { xs: "100%", sm: "100%", md: "100%", lg: "100%", xl: "230px" },
      maxHeight: { xl: "calc(100vh - 120px)" },
      overflow: { xl: "auto" } as const,
      bgcolor: theme.palette.mode === "dark" ? "rgba(26, 26, 46, 0.95)" : "rgba(255, 255, 255, 0.95)",
      border: theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
      borderRadius: "12px",
      boxShadow:
        theme.palette.mode === "dark" ? "0 8px 25px rgba(139, 92, 246, 0.15)" : "0 4px 20px rgba(0, 0, 0, 0.1)",
      p: 2,
      backdropFilter: "blur(10px)",
      zIndex: { xl: 999 },
    }),
    [theme.palette.mode]
  );

  const titleStyles = useMemo(
    () => ({
      color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
      fontWeight: 600,
      // mb: 1,
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

  const navContent = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
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
                <ListItemButton
                  component={Link}
                  href={`/channels/${channel.slug}`}
                  sx={listItemButtonStyles}
                  onClick={closeDrawerIfNeeded}
                >
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
      </Box>

      {shouldShowStories && <Divider sx={dividerStyles} />}

      {shouldShowStories && (
        <Box>
          <Typography variant="subtitle2" sx={titleStyles}>
            {totalPages ? `현재 페이지 (${navPage} / ${totalPages})` : `현재 페이지 (${navPage}페이지)`}
          </Typography>

          <List dense>
            {(navStoriesData?.results || stories).map((story: any) => (
              <ListItem key={story.id} disablePadding>
                <ListItemButton onClick={() => handleStorySelect(story.id)} sx={storyListItemButtonStyles}>
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
                      {story.userId && isUserBlinded(story.userId) ? "블라인드 글" : story.title}
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

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 1,
              mt: 1,
              px: 1,
              flexDirection: isCompactLayout ? "column" : "row",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              fullWidth={isCompactLayout}
              disabled={navPage <= 1 || navLoading}
              onClick={() => setNavPage((p) => Math.max(1, p - 1))}
            >
              이전 페이지
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth={isCompactLayout}
              disabled={navLoading || (totalPages !== null && navPage >= totalPages)}
              onClick={() => setNavPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1))}
            >
              다음 페이지
            </Button>
          </Box>

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
            총 {navStoriesData?.total ?? navStoriesData?.results?.length ?? stories.length}개 게시글
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (isCompactLayout) {
    return (
      <>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<MenuBookRoundedIcon />}
          onClick={() => setMobileDrawerOpen(true)}
          sx={{
            borderRadius: 2,
            justifyContent: "flex-start",
            color: theme.palette.mode === "dark" ? "#e2e8f0" : "inherit",
            borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)",
          }}
        >
          채널 · 게시글 탐색
        </Button>

        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: "min(90vw, 360px)",
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(15,15,35,0.98), rgba(30,30,50,0.95))"
                  : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
              borderRight:
                theme.palette.mode === "dark" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                채널 · 게시글 탐색
              </Typography>
              <IconButton onClick={() => setMobileDrawerOpen(false)} aria-label="채널 탐색 닫기">
                <CloseRoundedIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>{navContent}</Box>
          </Box>
        </Drawer>
      </>
    );
  }

  return <Box sx={containerStyles}>{navContent}</Box>;
};

export default memo(NavMenuBar);
