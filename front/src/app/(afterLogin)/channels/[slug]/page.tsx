"use client";
// 채널 상세 페이지 (Slug 기반)
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Tab,
  Tabs,
  IconButton,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Create as CreateIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  EmojiEvents as EmojiEventsIcon,
  Verified as VerifiedIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Announcement as AnnouncementIcon,
  FiberNew as FiberNewIcon,
} from "@mui/icons-material";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMessage } from "@/app/store/messageStore";
import usePageStore from "@/app/store/pageStore";
import { useSubscriptionStore } from "@/app/store/subscriptionStore";
import { TABLE_VIEW_COUNT } from "@/app/const/VIEW_COUNT";
import { TAB_SELECT_OPTIONS } from "@/app/const/WRITE_CONST";
import CustomizedTables from "@/app/components/table/CustomizedTables";
import CustomizedCardView from "@/app/components/table/CustomizedCardView";
import Pagination from "@/app/components/common/Pagination";
import SearchBar from "@/app/components/common/SearchBar";
import Loading from "@/app/components/common/Loading";
import ErrorView from "@/app/components/common/ErrorView";
// API 함수들 import
import { getChannelBySlug, subscribeChannel, unsubscribeChannel, Channel } from "@/app/api/channelsApi";
// 새로운 커스텀 훅들 import
import { useChannelStories } from "@/app/components/api/useChannelStories";
import { useChannelCardStories } from "@/app/components/api/useChannelCardStories";

const ChannelDetailPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const channelSlug = params?.slug as string;
  const { data: session } = useSession();
  const { showMessage } = useMessage();
  const queryClient = useQueryClient();
  const { currentPage, setCurrentPage } = usePageStore();
  const {
    isSubscribed: checkIsSubscribed,
    addSubscription,
    removeSubscription,
    loadSubscriptions,
  } = useSubscriptionStore();

  // 상태 관리
  const [currentTab, setCurrentTab] = useState("all");
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortOrder, setSortOrder] = useState<"recent" | "view" | "recommend">("recent");
  const [recommendRankingMode, setRecommendRankingMode] = useState(false);
  const [searchParamsState, setSearchParamsState] = useState<{ type: string; query: string } | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);

  const viewCount = TABLE_VIEW_COUNT;

  // 채널 정보 조회 (slug 기반)
  const {
    data: channelData,
    isLoading: channelLoading,
    isError: channelError,
    error: channelApiError,
  } = useQuery<Channel>({
    queryKey: ["channel", "slug", channelSlug],
    queryFn: () => getChannelBySlug(channelSlug),
    enabled: !!channelSlug,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
    retry: 2,
  });

  // 채널 ID 추출
  const channelId = channelData?.id || 0;

  // 현재 채널의 구독 상태
  const isSubscribed = checkIsSubscribed(channelId);

  // URL 파라미터에서 상태 초기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);

      // 카테고리 초기화
      const categoryParam = urlParams.get("category");
      if (categoryParam) {
        setCurrentTab(categoryParam);
      }

      // 뷰 모드 초기화
      const viewModeParam = urlParams.get("viewMode");
      if (viewModeParam === "card") {
        setViewMode("card");
      }

      // 추천 랭킹 모드 초기화
      const recommendRankingParam = urlParams.get("recommendRanking");
      if (recommendRankingParam === "true") {
        setRecommendRankingMode(true);
      }

      // 정렬 순서 초기화
      const sortOrderParam = urlParams.get("sortOrder");
      if (sortOrderParam && ["recent", "view", "recommend"].includes(sortOrderParam)) {
        setSortOrder(sortOrderParam as "recent" | "view" | "recommend");
      }

      // 페이지 초기화
      const pageParam = urlParams.get("page");
      if (pageParam) {
        setCurrentPage(Number(pageParam));
      }

      // 검색 상태 초기화
      const searchType = urlParams.get("searchType");
      const searchQuery = urlParams.get("searchQuery");
      if (searchType && searchQuery) {
        setSearchParamsState({ type: searchType, query: searchQuery });
      }
    }
  }, [setCurrentPage]);

  // 채널 테이블 데이터 조회
  const {
    data: tableData,
    error: tableError,
    isLoading: tableLoading,
  } = useChannelStories({
    channelId,
    category: currentTab,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    viewMode,
  });

  // 채널 카드 데이터 조회
  const {
    data: cardData,
    error: cardError,
    isLoading: cardLoading,
  } = useChannelCardStories({
    channelId,
    category: currentTab,
    currentPage,
    searchParamsState,
    recommendRankingMode,
    viewCount,
    viewMode,
  });

  // 데이터 처리
  const currentData = viewMode === "card" ? cardData : tableData;
  const currentError = viewMode === "card" ? cardError : tableError;
  const currentLoading = viewMode === "card" ? cardLoading : tableLoading;
  const currentTotal = currentData?.total || 0;

  // 구독 mutation
  const subscribeMutation = useMutation({
    mutationFn: subscribeChannel,
    onSuccess: () => {
      if (channelData) {
        addSubscription(channelData);
      }
      showMessage("채널을 구독했습니다!", "success");
      queryClient.invalidateQueries({ queryKey: ["channel", "slug", channelSlug] });
    },
    onError: (error: any) => {
      console.error("구독 실패:", error);
      showMessage(error.response?.data?.message || "구독에 실패했습니다.", "error");
    },
  });

  // 구독 취소 mutation
  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeChannel,
    onSuccess: () => {
      removeSubscription(channelId);
      showMessage("채널 구독을 취소했습니다.", "info");
      queryClient.invalidateQueries({ queryKey: ["channel", "slug", channelSlug] });
    },
    onError: (error: any) => {
      console.error("구독 취소 실패:", error);
      showMessage(error.response?.data?.message || "구독 취소에 실패했습니다.", "error");
    },
  });

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setCurrentPage(1);

    const params = new URLSearchParams();
    params.set("category", newValue);

    if (searchParamsState) {
      params.set("searchType", searchParamsState.type);
      params.set("searchQuery", searchParamsState.query);
    }

    params.set("recommendRanking", recommendRankingMode.toString());
    params.set("viewMode", viewMode);
    params.set("sortOrder", sortOrder);

    router.push(`/channels/${channelSlug}?${params.toString()}`, { scroll: false });
  };

  // 구독 토글 핸들러
  const handleSubscribeToggle = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }

    if (isSubscribed) {
      setShowUnsubscribeConfirm(true);
    } else {
      subscribeMutation.mutate(channelId);
    }
  };

  // 글쓰기 핸들러
  const handleWritePost = () => {
    if (!session?.user) {
      showMessage("로그인이 필요합니다.", "warning");
      return;
    }
    router.push(`/write/story?channel=${channelId}`);
  };

  // 게시글 클릭 핸들러
  const handlePostClick = (postId: number) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("previousMainPageUrl", window.location.href);
    }
    router.push(`/detail/${postId}`);
  };

  // 로딩 처리
  if (channelLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
              : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        }}
      >
        <CircularProgress
          size={60}
          sx={{
            color: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.8)" : "#1976d2",
          }}
        />
      </Box>
    );
  }

  // 에러 처리
  if (channelError || !channelData) {
    return <ErrorView />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(16, 16, 32, 0.98))"
            : "linear-gradient(135deg, #f8f9fa, #e9ecef)",
        paddingTop: "80px",
      }}
    >
      <Box sx={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* 채널 헤더 */}
        <Card
          sx={{
            mb: 3,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(30, 30, 60, 0.9), rgba(20, 20, 40, 0.95))"
                : "linear-gradient(135deg, #ffffff, #f8f9fa)",
            border: `1px solid ${
              theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.2)" : "rgba(25, 118, 210, 0.2)"
            }`,
            borderRadius: "16px",
            boxShadow:
              theme.palette.mode === "dark" ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <CardContent sx={{ padding: "24px" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, #8b5cf6, #a855f7)"
                        : "linear-gradient(135deg, #1976d2, #42a5f5)",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {channelData.channel_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, #a78bfa, #c084fc)"
                          : "linear-gradient(135deg, #1976d2, #42a5f5)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {channelData.channel_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
                      mt: 0.5,
                    }}
                  >
                    /{channelData.slug}
                  </Typography>
                </Box>
              </Box>

              {session?.user && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={isSubscribed ? "contained" : "outlined"}
                    startIcon={<PersonAddIcon />}
                    onClick={handleSubscribeToggle}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 600,
                      minWidth: "100px",
                      height: "40px",
                    }}
                  >
                    {isSubscribed ? "구독중" : "구독하기"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CreateIcon />}
                    onClick={handleWritePost}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 600,
                      height: "40px",
                    }}
                  >
                    글쓰기
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<ArticleIcon />}
                label={`게시글 ${channelData.story_count}개`}
                sx={{
                  background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#1976d2",
                  fontWeight: 600,
                }}
              />
              <Chip
                icon={<PeopleIcon />}
                label={`구독자 ${channelData.subscriber_count}명`}
                sx={{
                  background: theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  color: theme.palette.mode === "dark" ? "#a78bfa" : "#1976d2",
                  fontWeight: 600,
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* 간단한 콘텐츠 영역 - 실제 구현에서는 더 많은 기능이 필요합니다 */}
        <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
          채널 콘텐츠는 여기에 표시됩니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default ChannelDetailPage;
